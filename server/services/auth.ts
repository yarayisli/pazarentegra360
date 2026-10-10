import { createHash, randomBytes, scrypt, timingSafeEqual, type BinaryLike } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { AnyDb } from "../db/seed";
import { sessions, tenants, users } from "../db/schema";

export const SESSION_COOKIE = "pe360_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

const SCRYPT = { N: 16384, r: 8, p: 5, keyLength: 64 } as const;

export interface AuthContext {
  userId: string;
  tenantId: string;
  email: string;
}

function scryptAsync(password: BinaryLike, salt: Buffer, N: number, r: number, p: number, keyLength: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, { N, r, p }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

// Stored as scrypt$N$r$p$salt$hash (parameters travel with the hash so they can be raised later).
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, SCRYPT.N, SCRYPT.r, SCRYPT.p, SCRYPT.keyLength);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scryptAsync(
    password,
    Buffer.from(salt, "base64"),
    Number(n),
    Number(r),
    Number(p),
    expected.length,
  );
  return timingSafeEqual(actual, expected);
}

// Used to spend the same time when the e-mail is unknown (reduces user enumeration by timing).
const dummyHash = hashPassword("dummy-password-for-timing");

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(db: AnyDb, userId: string, tenantId: string, now = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now + SESSION_TTL_MS);
  await db.insert(sessions).values({ tenantId, userId, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

export async function findSession(db: AnyDb, token: string, now = new Date()): Promise<AuthContext | null> {
  const [row] = await db
    .select({ userId: users.id, tenantId: users.tenantId, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, now)))
    .limit(1);
  return row ?? null;
}

export async function deleteSession(db: AnyDb, token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

export class EmailTakenError extends Error {}

// Creates a tenant together with its first user.
export async function registerUser(db: AnyDb, input: { email: string; password: string; tenantName: string }) {
  const passwordHash = await hashPassword(input.password);
  try {
    return await db.transaction(async (tx) => {
      const [tenant] = await tx.insert(tenants).values({ name: input.tenantName }).returning();
      const [user] = await tx
        .insert(users)
        .values({ tenantId: tenant.id, email: input.email, passwordHash })
        .returning();
      return { userId: user.id, tenantId: tenant.id, email: user.email };
    });
  } catch (err) {
    // Unique violation on users_email_uq (SQLSTATE 23505); drivers wrap it differently.
    const cause = (err as { cause?: { code?: string } }).cause;
    if ((err as { code?: string }).code === "23505" || cause?.code === "23505") throw new EmailTakenError();
    throw err;
  }
}

export async function authenticate(db: AnyDb, email: string, password: string): Promise<AuthContext | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user?.passwordHash) {
    await verifyPassword(password, await dummyHash);
    return null;
  }
  if (!(await verifyPassword(password, user.passwordHash))) return null;
  return { userId: user.id, tenantId: user.tenantId, email: user.email };
}

export function readSessionToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx > 0 && part.slice(0, idx).trim() === SESSION_COOKIE) {
      const value = part.slice(idx + 1).trim();
      return value || null;
    }
  }
  return null;
}
