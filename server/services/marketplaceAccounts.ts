import { and, eq } from "drizzle-orm";
import type { AnyDb } from "../db/seed";
import { marketplaceAccounts } from "../db/schema";
import { decryptJson, encryptJson } from "./crypto";

export const MARKETPLACES = ["trendyol", "hepsiburada", "n11", "ikas"] as const;
export type Marketplace = (typeof MARKETPLACES)[number];
export type AccountConfig = Record<string, string | boolean>;

export const MASK = "••••";

// Identifier fields are shown as-is; every other string field is treated as a secret.
const PUBLIC_FIELDS = new Set(["supplierId", "merchantId", "storeDomain", "storeName"]);

// Fields that must be present for a connection test to pass.
const REQUIRED_FIELDS: Record<Marketplace, string[]> = {
  trendyol: ["supplierId", "apiKey", "apiSecret"],
  hepsiburada: ["merchantId", "serviceKey"],
  n11: ["appKey", "appSecret"],
  ikas: ["storeDomain", "apiClientId", "apiClientSecret"],
};

export const isMarketplace = (v: unknown): v is Marketplace => MARKETPLACES.includes(v as Marketplace);

// Only these fields are ever read from a request or stored; unknown keys (e.g. "__proto__") are dropped.
const ALLOWED_FIELDS: Record<Marketplace, string[]> = {
  trendyol: ["supplierId", "apiKey", "apiSecret", "autoPicking", "autoInvoice", "testMode", "webhookActive", "storeName"],
  hepsiburada: ["merchantId", "serviceKey", "autoInvoice", "testMode", "storeName"],
  n11: ["appKey", "appSecret", "autoInvoice", "testMode", "storeName"],
  ikas: ["storeDomain", "apiClientId", "apiClientSecret", "syncInventory", "syncOrders", "storeName"],
};

export function sanitizeConfig(marketplace: Marketplace, input: unknown): AccountConfig {
  if (typeof input !== "object" || input === null) return {};
  const source = input as Record<string, unknown>;
  const entries: [string, string | boolean][] = [];
  for (const field of ALLOWED_FIELDS[marketplace]) {
    const v = Object.hasOwn(source, field) ? source[field] : undefined;
    if (typeof v === "string" || typeof v === "boolean") entries.push([field, v]);
  }
  return Object.fromEntries(entries);
}

export function maskValue(v: string): string {
  return v.length > 4 ? `${MASK}${v.slice(-4)}` : MASK;
}

export function maskConfig(config: AccountConfig): AccountConfig {
  return Object.fromEntries(
    Object.entries(config).map(([k, v]) => [k, typeof v === "string" && v !== "" && !PUBLIC_FIELDS.has(k) ? maskValue(v) : v]),
  );
}

// On update, masked or empty secret values mean "keep what is stored".
export function mergeConfig(existing: AccountConfig, incoming: AccountConfig): AccountConfig {
  const kept = Object.entries(incoming).filter(
    ([k, v]) => !(typeof v === "string" && !PUBLIC_FIELDS.has(k) && (v === "" || v.startsWith(MASK))),
  );
  return { ...existing, ...Object.fromEntries(kept) };
}

export function missingFields(marketplace: Marketplace, config: AccountConfig): string[] {
  return REQUIRED_FIELDS[marketplace].filter((f) => typeof config[f] !== "string" || config[f] === "");
}

export interface AccountView {
  id: string;
  marketplace: string;
  storeName: string;
  status: string;
  config: AccountConfig;
}

type Row = typeof marketplaceAccounts.$inferSelect;

function toView(row: Row): AccountView {
  const config = row.encryptedCredentials ? sanitizeConfig(row.marketplace as Marketplace, decryptJson(row.encryptedCredentials)) : {};
  return { id: row.id, marketplace: row.marketplace, storeName: row.storeName, status: row.status, config: maskConfig(config) };
}

const storeNameOf = (marketplace: string, config: AccountConfig) =>
  typeof config.storeName === "string" && config.storeName ? config.storeName : marketplace;

export async function listAccounts(db: AnyDb, tenantId: string): Promise<AccountView[]> {
  const rows = await db.select().from(marketplaceAccounts).where(eq(marketplaceAccounts.tenantId, tenantId));
  return rows.map(toView);
}

export async function createAccount(db: AnyDb, tenantId: string, marketplace: Marketplace, config: AccountConfig) {
  const [row] = await db
    .insert(marketplaceAccounts)
    .values({ tenantId, marketplace, storeName: storeNameOf(marketplace, config), encryptedCredentials: encryptJson(config) })
    .returning();
  return toView(row);
}

async function findRow(db: AnyDb, tenantId: string, id: string): Promise<Row | undefined> {
  const [row] = await db
    .select()
    .from(marketplaceAccounts)
    .where(and(eq(marketplaceAccounts.id, id), eq(marketplaceAccounts.tenantId, tenantId)));
  return row;
}

export async function updateAccount(db: AnyDb, tenantId: string, id: string, rawIncoming: unknown) {
  const row = await findRow(db, tenantId, id);
  if (!row) return null;
  const marketplace = row.marketplace as Marketplace;
  const existing = row.encryptedCredentials ? sanitizeConfig(marketplace, decryptJson(row.encryptedCredentials)) : {};
  const config = mergeConfig(existing, sanitizeConfig(marketplace, rawIncoming));
  const [updated] = await db
    .update(marketplaceAccounts)
    .set({ storeName: storeNameOf(row.marketplace, config), encryptedCredentials: encryptJson(config) })
    .where(and(eq(marketplaceAccounts.id, id), eq(marketplaceAccounts.tenantId, tenantId)))
    .returning();
  return toView(updated);
}

export async function deleteAccount(db: AnyDb, tenantId: string, id: string): Promise<boolean> {
  const rows = await db
    .delete(marketplaceAccounts)
    .where(and(eq(marketplaceAccounts.id, id), eq(marketplaceAccounts.tenantId, tenantId)))
    .returning({ id: marketplaceAccounts.id });
  return rows.length > 0;
}

// Placeholder connection test: validates required fields only (no marketplace request yet; see #14).
export async function testAccount(db: AnyDb, tenantId: string, id: string) {
  const row = await findRow(db, tenantId, id);
  if (!row || !isMarketplace(row.marketplace)) return null;
  const config = row.encryptedCredentials ? sanitizeConfig(row.marketplace, decryptJson(row.encryptedCredentials)) : {};
  const missing = missingFields(row.marketplace, config);
  const status = missing.length === 0 ? "CONNECTED" : "DISCONNECTED";
  await db
    .update(marketplaceAccounts)
    .set({ status })
    .where(and(eq(marketplaceAccounts.id, id), eq(marketplaceAccounts.tenantId, tenantId)));
  return { status, missing, marketplace: row.marketplace, config };
}
