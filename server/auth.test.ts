import { eq } from "drizzle-orm";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sessions, users } from "./db/schema";
import { findSession, hashPassword, readSessionToken, SESSION_COOKIE, verifyPassword } from "./services/auth";
import { createTestApp } from "./testApp";

let t: Awaited<ReturnType<typeof createTestApp>>;

beforeEach(async () => {
  t = await createTestApp();
});

afterEach(() => t.close());

const creds = { email: "owner@example.com", password: "correct-horse-battery" };
const cookieOf = (res: request.Response) => (res.headers["set-cookie"] as unknown as string[] | undefined)?.[0] ?? "";

describe("requireAuth", () => {
  it("lets /api/health through without a session", async () => {
    const res = await request(t.app).get("/api/health");
    expect(res.status).toBe(200);
  });

  it.each([
    ["get", "/api/orders/events"],
    ["get", "/api/webhooks/logs"],
    ["post", "/api/orders/reconcile"],
    ["post", "/api/webhooks/simulate"],
    ["post", "/api/ai/copilot"],
    ["post", "/api/ai/suggest-reply"],
    ["post", "/api/trendyol/verify-credentials"],
    ["get", "/api/auth/me"],
    ["get", "/api/does-not-exist"],
  ] as const)("rejects %s %s without a session (401)", async (method, path) => {
    const res = await request(t.app)[method](path);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, error: { code: "UNAUTHORIZED", message: expect.any(String) } });
  });

  it("rejects a forged or expired session token", async () => {
    const forged = await request(t.app).get("/api/auth/me").set("Cookie", `${SESSION_COOKIE}=not-a-real-token`);
    expect(forged.status).toBe(401);

    const agent = await t.signUp();
    await t.db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) });
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });
});

describe("POST /api/auth/register", () => {
  it("creates a tenant and user, sets an httpOnly session cookie and logs in", async () => {
    const res = await request(t.app)
      .post("/api/auth/register")
      .send({ ...creds, tenantName: "Mağazam" });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, user: { email: creds.email } });
    expect(cookieOf(res)).toMatch(/^pe360_session=.+HttpOnly/i);
    expect(cookieOf(res)).toMatch(/SameSite=Lax/i);

    const me = await request(t.app).get("/api/auth/me").set("Cookie", cookieOf(res));
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(creds.email);
  });

  it("never stores the password or the session token in plaintext", async () => {
    const res = await request(t.app).post("/api/auth/register").send(creds);
    const [user] = await t.db.select().from(users);
    expect(user.passwordHash).not.toContain(creds.password);
    expect(user.passwordHash).toMatch(/^scrypt\$16384\$8\$5\$/);
    const token = readSessionToken(cookieOf(res))!;
    const rows = await t.db.select().from(sessions);
    expect(rows).toHaveLength(1);
    expect(rows[0].tokenHash).not.toBe(token);
    expect(JSON.stringify(res.body)).not.toContain(user.passwordHash!);
  });

  it("normalizes the e-mail and rejects a duplicate with 409", async () => {
    await request(t.app)
      .post("/api/auth/register")
      .send({ ...creds, email: "  Owner@Example.COM " });
    const [user] = await t.db.select().from(users);
    expect(user.email).toBe("owner@example.com");

    const dup = await request(t.app).post("/api/auth/register").send(creds);
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe("EMAIL_TAKEN");
  });

  it.each([
    [{ email: "nope", password: "long-enough-pw" }, "INVALID_EMAIL"],
    [{ email: creds.email, password: "short" }, "INVALID_PASSWORD"],
    [{ email: creds.email, password: "x".repeat(129) }, "INVALID_PASSWORD"],
    [{ email: creds.email, password: "long-enough-pw", tenantName: "x".repeat(101) }, "INVALID_TENANT_NAME"],
    [{ email: 123, password: ["a"] }, "INVALID_EMAIL"],
    [undefined, "INVALID_EMAIL"],
  ])("rejects invalid input %j with 400", async (body, code) => {
    const res = await request(t.app).post("/api/auth/register").send(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(code);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await t.signUp(creds.email, creds.password);
  });

  it("logs in with the right password", async () => {
    const res = await request(t.app)
      .post("/api/auth/login")
      .send({ ...creds, email: "OWNER@example.com" });
    expect(res.status).toBe(200);
    expect(cookieOf(res)).toContain(`${SESSION_COOKIE}=`);
  });

  it("answers a wrong password and an unknown e-mail identically", async () => {
    const wrong = await request(t.app)
      .post("/api/auth/login")
      .send({ ...creds, password: "wrong-password" });
    const unknown = await request(t.app)
      .post("/api/auth/login")
      .send({ email: "x@example.com", password: "whatever-pw" });
    const empty = await request(t.app).post("/api/auth/login").send({});
    for (const res of [wrong, unknown, empty]) {
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    }
    expect(wrong.body).toEqual(unknown.body);
    expect(cookieOf(wrong)).toBe("");
  });

  it("cannot log in as a seeded user without a password hash", async () => {
    await t.db.update(users).set({ passwordHash: null }).where(eq(users.email, creds.email));
    const res = await request(t.app).post("/api/auth/login").send(creds);
    expect(res.status).toBe(401);
  });

  it("rate limits failed attempts (429)", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await request(t.app)
        .post("/api/auth/login")
        .send({ ...creds, password: "wrong-password" });
      expect(res.status).toBe(401);
    }
    const limited = await request(t.app)
      .post("/api/auth/login")
      .send({ ...creds, password: "wrong-password" });
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe("RATE_LIMITED");
    expect(limited.headers["retry-after"]).toBeDefined();
  });

  it("does not count successful logins toward the limit", async () => {
    for (let i = 0; i < 12; i++) {
      expect((await request(t.app).post("/api/auth/login").send(creds)).status).toBe(200);
    }
  });
});

describe("POST /api/auth/logout", () => {
  it("invalidates the session server-side", async () => {
    const res = await request(t.app).post("/api/auth/register").send(creds);
    const cookie = cookieOf(res);

    const out = await request(t.app).post("/api/auth/logout").set("Cookie", cookie);
    expect(out.status).toBe(200);
    expect(cookieOf(out)).toMatch(/pe360_session=;/);

    // The old cookie no longer works even if a client kept it.
    const me = await request(t.app).get("/api/auth/me").set("Cookie", cookie);
    expect(me.status).toBe(401);
  });

  it("succeeds without a session", async () => {
    expect((await request(t.app).post("/api/auth/logout")).status).toBe(200);
  });
});

describe("register rate limit", () => {
  it("returns 429 after too many registrations from one IP", async () => {
    for (let i = 0; i < 20; i++) {
      const res = await request(t.app)
        .post("/api/auth/register")
        .send({ email: `u${i}@example.com`, password: "long-enough-pw" });
      expect(res.status).toBe(201);
    }
    const limited = await request(t.app)
      .post("/api/auth/register")
      .send({ email: "late@example.com", password: "long-enough-pw" });
    expect(limited.status).toBe(429);
  }, 60_000);
});

describe("password hashing", () => {
  it("verifies the right password and rejects others", async () => {
    const hash = await hashPassword("s3cret-password");
    expect(await verifyPassword("s3cret-password", hash)).toBe(true);
    expect(await verifyPassword("s3cret-passworD", hash)).toBe(false);
  });

  it("still verifies hashes created with older (weaker) parameters", async () => {
    const { scryptSync } = await import("node:crypto");
    const salt = Buffer.from("0123456789abcdef");
    const key = scryptSync("old-password", salt, 64, { N: 16384, r: 8, p: 1 });
    const legacy = ["scrypt", 16384, 8, 1, salt.toString("base64"), key.toString("base64")].join("$");
    expect(await verifyPassword("old-password", legacy)).toBe(true);
    expect(await verifyPassword("wrong", legacy)).toBe(false);
  });

  it("uses a random salt per hash", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("x", "plaintext")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2$3$a$b")).toBe(false);
  });
});

describe("readSessionToken", () => {
  it("finds the session cookie among others", () => {
    expect(readSessionToken(`a=1; ${SESSION_COOKIE}=tok; b=2`)).toBe("tok");
  });

  it("returns null when absent or empty", () => {
    expect(readSessionToken(undefined)).toBeNull();
    expect(readSessionToken("a=1")).toBeNull();
    expect(readSessionToken(`${SESSION_COOKIE}=`)).toBeNull();
  });
});

describe("findSession", () => {
  it("returns null for an unknown token", async () => {
    expect(await findSession(t.db, "nope")).toBeNull();
  });
});

describe("tenant isolation", () => {
  it("keeps one tenant out of another tenant's data, whatever the request claims", async () => {
    const a = await t.signUp("a@example.com");
    const b = await t.signUp("b@example.com");
    await a.post("/api/webhooks/simulate").send({
      marketplace: "trendyol",
      eventType: "x",
      orderNumber: "A-1",
      orderId: 777,
      newStatus: "Shipped",
      idempotencyKey: "a-1",
    });

    // B cannot see A's event, even when passing a tenant id in the query/body.
    const [userA] = await t.db.select().from(users).where(eq(users.email, "a@example.com"));
    const res = await b.get("/api/orders/events").query({ orderId: 777, tenantId: userA.tenantId });
    expect(res.body.events).toHaveLength(0);
    const all = await b.get("/api/orders/events");
    expect(all.body.events.some((e: any) => e.orderNumber === "A-1")).toBe(false);
  });

  it("gives every registration its own tenant", async () => {
    await t.signUp("a@example.com");
    await t.signUp("b@example.com");
    const rows = await t.db.select().from(users);
    expect(new Set(rows.map((u) => u.tenantId)).size).toBe(2);
  });
});
