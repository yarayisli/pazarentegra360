import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auditLogs } from "./db/schema";
import { maskSecrets } from "./services/audit";
import { createTestApp } from "./testApp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 }); // each test boots an embedded Postgres and hashes with scrypt

// Fake fixtures are assembled at runtime so secret scanners do not flag literals.
const FAKE_KEY = ["fake", "key", "SECRETKEY1234"].join("-");
const FAKE_SECRET = ["fake", "secret", "SECRETVALUE9876"].join("-");
const trendyol = { supplierId: "149208", apiKey: FAKE_KEY, apiSecret: FAKE_SECRET, storeName: "Mağazam" };

let t: Awaited<ReturnType<typeof createTestApp>>;
let savedKey: string | undefined;

beforeEach(async () => {
  savedKey = process.env.CREDENTIALS_ENCRYPTION_KEY;
  process.env.CREDENTIALS_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  t = await createTestApp();
});

afterEach(async () => {
  if (savedKey === undefined) delete process.env.CREDENTIALS_ENCRYPTION_KEY;
  else process.env.CREDENTIALS_ENCRYPTION_KEY = savedKey;
  await t.close();
});

const list = async (agent: Awaited<ReturnType<typeof t.signUp>>, qs = "") =>
  (await agent.get(`/api/audit-logs${qs}`)).body;

describe("audit log", () => {
  it("requires a session", async () => {
    const { default: request } = await import("supertest");
    expect((await request(t.app).get("/api/audit-logs")).status).toBe(401);
  });

  it("records register and login", async () => {
    const a = await t.signUp("a@example.com");
    await a.post("/api/auth/login").send({ email: "a@example.com", password: "correct-horse-battery" });
    const body = await list(a);
    expect(body.items.map((i: { action: string }) => i.action).sort()).toEqual(["auth.login", "auth.register"]);
  });

  it("records logout", async () => {
    const a = await t.signUp("a@example.com");
    await a.post("/api/auth/logout");
    const rows = await t.db.select().from(auditLogs);
    expect(rows.map((r) => r.action)).toContain("auth.logout");
  });

  it("records account create, update and delete without secret values", async () => {
    const a = await t.signUp();
    const created = await a.post("/api/marketplace-accounts").send({ marketplace: "trendyol", config: trendyol });
    const id = created.body.account.id;
    await a.put(`/api/marketplace-accounts/${id}`).send({ config: { apiKey: FAKE_KEY + "-new" } });
    await a.delete(`/api/marketplace-accounts/${id}`);

    const body = await list(a);
    const actions = body.items.map((i: { action: string }) => i.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        "marketplace_account.create",
        "marketplace_account.update",
        "marketplace_account.delete",
      ]),
    );
    const update = body.items.find((i: { action: string }) => i.action === "marketplace_account.update");
    expect(update.summary).toContain("apiKey");
    expect(update.targetId).toBe(id);

    const raw = JSON.stringify(await t.db.select().from(auditLogs));
    for (const secret of [FAKE_KEY, FAKE_SECRET, "correct-horse-battery"]) expect(raw).not.toContain(secret);
  });

  it("does not list another tenant's records", async () => {
    const a = await t.signUp("a@example.com");
    const b = await t.signUp("b@example.com");
    await a.post("/api/marketplace-accounts").send({ marketplace: "trendyol", config: trendyol });
    const bBody = await list(b);
    expect(bBody.items.every((i: { action: string }) => i.action === "auth.register")).toBe(true);
    expect(bBody.total).toBe(1);
    const aBody = await list(a);
    expect(aBody.total).toBe(2);
  });

  it("paginates and filters by action and date", async () => {
    const a = await t.signUp();
    for (let i = 0; i < 3; i++) {
      await a.post("/api/marketplace-accounts").send({ marketplace: "trendyol", config: trendyol });
    }
    const page1 = await list(a, "?pageSize=2&page=1");
    const page2 = await list(a, "?pageSize=2&page=2");
    expect(page1.total).toBe(4);
    expect(page1.items).toHaveLength(2);
    expect(page2.items).toHaveLength(2);
    expect(new Set([...page1.items, ...page2.items].map((i: { id: string }) => i.id)).size).toBe(4);

    const filtered = await list(a, "?action=marketplace_account.create");
    expect(filtered.total).toBe(3);

    const future = new Date(Date.now() + 3_600_000).toISOString();
    expect((await list(a, `?from=${encodeURIComponent(future)}`)).total).toBe(0);
    expect((await list(a, `?to=${encodeURIComponent(future)}`)).total).toBe(4);
  });

  it("rejects invalid query values", async () => {
    const a = await t.signUp();
    for (const qs of ["?page=0", "?pageSize=101", "?pageSize=abc", "?from=nope", "?action[]=x"]) {
      const res = await a.get(`/api/audit-logs${qs}`);
      expect(res.status, qs).toBe(400);
      expect(res.body.success).toBe(false);
    }
  });

  it("stores the caller's ip", async () => {
    await t.signUp();
    const [row] = await t.db.select().from(auditLogs).where(eq(auditLogs.action, "auth.register"));
    expect(row.ip).toBeTruthy();
  });
});

describe("maskSecrets", () => {
  it("masks values of secret-looking keys only", () => {
    expect(maskSecrets("apiKey=abc123 store=Foo password: hunter2 token='x y'")).toBe(
      "apiKey=**** store=Foo password=**** token=****",
    );
  });
});
