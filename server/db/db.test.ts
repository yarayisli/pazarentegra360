import { PGlite } from "@electric-sql/pglite";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { INITIAL_PACKAGES, INITIAL_PRODUCTS } from "../../src/data/mockData.ts";
import { createDb, DEFAULT_DATABASE_URL, getDatabaseUrl } from "./client.ts";
import * as schema from "./schema.ts";
import { DEMO_USER_EMAIL, seedDemo } from "./seed.ts";

const migrationsFolder = new URL("./migrations", import.meta.url).pathname;

// Embedded Postgres: each test gets its own fresh database (no shared state).
let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;

beforeEach(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
});

afterEach(async () => {
  await client.close();
});

describe("schema migrations", () => {
  it("creates all initial tables", async () => {
    const res = await client.query<{ table_name: string }>(
      "select table_name from information_schema.tables where table_schema = 'public'",
    );
    const names = res.rows.map((r) => r.table_name);
    for (const t of [
      "tenants",
      "users",
      "sessions",
      "marketplace_accounts",
      "products",
      "product_channel_listings",
      "orders",
      "order_lines",
      "order_events",
      "webhook_logs",
    ]) {
      expect(names).toContain(t);
    }
  });

  it("puts tenant_id on every business table", async () => {
    const res = await client.query<{ table_name: string }>(
      "select table_name from information_schema.columns where table_schema = 'public' and column_name = 'tenant_id'",
    );
    expect(res.rows).toHaveLength(9);
  });
});

describe("seedDemo", () => {
  it("loads the mock data into a demo tenant", async () => {
    const { tenantId } = await seedDemo(db);
    const [orders] = await db.select({ n: count() }).from(schema.orders).where(eq(schema.orders.tenantId, tenantId));
    const [products] = await db
      .select({ n: count() })
      .from(schema.products)
      .where(eq(schema.products.tenantId, tenantId));
    const [lines] = await db.select({ n: count() }).from(schema.orderLines);
    expect(orders.n).toBe(INITIAL_PACKAGES.length);
    expect(products.n).toBe(INITIAL_PRODUCTS.length);
    expect(lines.n).toBe(INITIAL_PACKAGES.reduce((s, p) => s + p.lines.length, 0));
    const users = await db.select().from(schema.users);
    expect(users[0].email).toBe(DEMO_USER_EMAIL);
  });

  it("never stores credentials", async () => {
    await seedDemo(db);
    const accounts = await db.select().from(schema.marketplaceAccounts);
    expect(accounts.length).toBeGreaterThan(0);
    expect(accounts.every((a) => a.encryptedCredentials === null)).toBe(true);
  });
});

describe("constraints", () => {
  it("rejects a duplicate idempotency key within a tenant", async () => {
    const { tenantId } = await seedDemo(db);
    const event = {
      tenantId,
      orderNumber: "1",
      marketplace: "trendyol",
      fromStatus: "None",
      toStatus: "Created",
      eventSource: "WEBHOOK",
      idempotencyKey: "k1",
      description: "x",
    };
    await db.insert(schema.orderEvents).values(event);
    await expect(db.insert(schema.orderEvents).values(event)).rejects.toThrow();
  });

  it("rejects the same barcode twice in one tenant", async () => {
    const { tenantId } = await seedDemo(db);
    const [first] = await db.select().from(schema.products).where(eq(schema.products.tenantId, tenantId)).limit(1);
    await expect(
      db.insert(schema.products).values({ tenantId, name: "dup", barcode: first.barcode, sku: "x" }),
    ).rejects.toThrow();
  });
});

describe("getDatabaseUrl", () => {
  it("falls back to the local docker-compose database", () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    expect(getDatabaseUrl()).toBe(DEFAULT_DATABASE_URL);
    process.env.DATABASE_URL = "postgres://x";
    expect(getDatabaseUrl()).toBe("postgres://x");
    if (prev === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prev;
  });
});

describe("createDb", () => {
  it("builds a pooled database lazily and closes cleanly", async () => {
    const { db: pgDb, close } = createDb("postgres://u:p@localhost:1/none"); // pool connects lazily
    expect(pgDb).toBeDefined();
    await close();
  });
});
