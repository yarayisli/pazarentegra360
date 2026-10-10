import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { marketplaceAccounts } from "./db/schema";
import { decryptJson, encryptJson, EncryptionKeyError, getEncryptionKey } from "./services/crypto";
import { createTestApp } from "./testApp";

const KEY = randomBytes(32).toString("base64");
// Fake fixtures are assembled at runtime so secret scanners do not flag literals.
const FAKE_KEY = ["fake", "key", "SECRETKEY1234"].join("-");
const FAKE_SECRET = ["fake", "secret", "SECRETVALUE9876"].join("-");
const trendyol = {
  supplierId: "149208",
  apiKey: FAKE_KEY,
  apiSecret: FAKE_SECRET,
  storeName: "Mağazam",
  autoPicking: true,
};

let t: Awaited<ReturnType<typeof createTestApp>>;
let savedKey: string | undefined;

beforeEach(async () => {
  savedKey = process.env.CREDENTIALS_ENCRYPTION_KEY;
  process.env.CREDENTIALS_ENCRYPTION_KEY = KEY;
  t = await createTestApp();
});

afterEach(async () => {
  if (savedKey === undefined) delete process.env.CREDENTIALS_ENCRYPTION_KEY;
  else process.env.CREDENTIALS_ENCRYPTION_KEY = savedKey;
  await t.close();
});

describe("crypto", () => {
  it("round-trips and uses a fresh IV each time", () => {
    const a = encryptJson({ x: 1 });
    expect(a).not.toBe(encryptJson({ x: 1 }));
    expect(decryptJson(a)).toEqual({ x: 1 });
  });

  it("rejects tampered ciphertext and malformed payloads", () => {
    const parts = encryptJson({ x: 1 }).split(":");
    parts[3] = Buffer.from("tampered-data").toString("base64");
    expect(() => decryptJson(parts.join(":"))).toThrow();
    expect(() => decryptJson("garbage")).toThrow();
  });

  it("accepts hex keys and rejects missing or short keys", () => {
    process.env.CREDENTIALS_ENCRYPTION_KEY = randomBytes(32).toString("hex");
    expect(getEncryptionKey()).toHaveLength(32);
    process.env.CREDENTIALS_ENCRYPTION_KEY = "short";
    expect(() => getEncryptionKey()).toThrow(EncryptionKeyError);
    delete process.env.CREDENTIALS_ENCRYPTION_KEY;
    expect(() => getEncryptionKey()).toThrow(EncryptionKeyError);
  });
});

describe("/api/marketplace-accounts", () => {
  it("requires a session", async () => {
    const request = (await import("supertest")).default;
    expect((await request(t.app).get("/api/marketplace-accounts")).status).toBe(401);
  });

  it("stores credentials encrypted, not as plaintext", async () => {
    const agent = await t.signUp();
    const res = await agent.post("/api/marketplace-accounts").send({ marketplace: "trendyol", config: trendyol });
    expect(res.status).toBe(201);

    const [row] = await t.db.select().from(marketplaceAccounts);
    expect(row.encryptedCredentials).toBeTruthy();
    expect(row.encryptedCredentials).not.toContain("SECRETKEY1234");
    expect(row.encryptedCredentials).not.toContain("SECRETVALUE9876");
    expect(decryptJson(row.encryptedCredentials!)).toMatchObject({
      apiKey: trendyol.apiKey,
      apiSecret: trendyol.apiSecret,
    });
  });

  it("never returns secrets from create, list or update", async () => {
    const agent = await t.signUp();
    const created = await agent.post("/api/marketplace-accounts").send({ marketplace: "trendyol", config: trendyol });
    const id = created.body.account.id;
    const list = await agent.get("/api/marketplace-accounts");
    const updated = await agent.put(`/api/marketplace-accounts/${id}`).send({ config: { storeName: "Yeni Ad" } });

    for (const body of [created.body, list.body, updated.body]) {
      const text = JSON.stringify(body);
      expect(text).not.toContain("SECRETKEY1234");
      expect(text).not.toContain("SECRETVALUE9876");
    }
    const account = list.body.accounts[0];
    expect(account.config).toMatchObject({
      supplierId: "149208",
      apiKey: "••••1234",
      apiSecret: "••••9876",
      autoPicking: true,
    });
  });

  it("keeps stored secrets when masked or empty values are sent back", async () => {
    const agent = await t.signUp();
    const { body } = await agent.post("/api/marketplace-accounts").send({ marketplace: "trendyol", config: trendyol });
    await agent
      .put(`/api/marketplace-accounts/${body.account.id}`)
      .send({ config: { apiKey: "••••1234", apiSecret: "", storeName: "B" } });
    const [row] = await t.db.select().from(marketplaceAccounts);
    expect(decryptJson(row.encryptedCredentials!)).toMatchObject({
      apiKey: trendyol.apiKey,
      apiSecret: trendyol.apiSecret,
      storeName: "B",
    });
    expect(row.storeName).toBe("B");

    await agent.put(`/api/marketplace-accounts/${body.account.id}`).send({ config: { apiKey: "fresh-0000" } });
    const [row2] = await t.db.select().from(marketplaceAccounts);
    expect(decryptJson(row2.encryptedCredentials!)).toMatchObject({ apiKey: "fresh-0000" });
  });

  it("isolates accounts between tenants", async () => {
    const a = await t.signUp("a@example.com");
    const b = await t.signUp("b@example.com");
    const { body } = await a.post("/api/marketplace-accounts").send({ marketplace: "trendyol", config: trendyol });
    const id = body.account.id;

    expect((await b.get("/api/marketplace-accounts")).body.accounts).toEqual([]);
    expect((await b.put(`/api/marketplace-accounts/${id}`).send({ config: {} })).status).toBe(404);
    expect((await b.delete(`/api/marketplace-accounts/${id}`)).status).toBe(404);
    expect((await b.post(`/api/marketplace-accounts/${id}/test`)).status).toBe(404);
    expect((await a.get("/api/marketplace-accounts")).body.accounts).toHaveLength(1);
  });

  it("validates marketplace and ids", async () => {
    const agent = await t.signUp();
    expect((await agent.post("/api/marketplace-accounts").send({ marketplace: "amazon" })).status).toBe(400);
    expect((await agent.put("/api/marketplace-accounts/not-a-uuid").send({})).status).toBe(404);
    expect((await agent.delete("/api/marketplace-accounts/not-a-uuid")).status).toBe(404);
    expect((await agent.post("/api/marketplace-accounts/not-a-uuid/test")).status).toBe(404);
  });

  it("deletes an account", async () => {
    const agent = await t.signUp();
    const { body } = await agent
      .post("/api/marketplace-accounts")
      .send({ marketplace: "n11", config: { appKey: "k", appSecret: "s" } });
    expect((await agent.delete(`/api/marketplace-accounts/${body.account.id}`)).body).toEqual({ success: true });
    expect((await agent.get("/api/marketplace-accounts")).body.accounts).toEqual([]);
  });

  it("tests a connection: connected when complete, 400 when fields are missing", async () => {
    const agent = await t.signUp();
    const ok = await agent.post("/api/marketplace-accounts").send({ marketplace: "trendyol", config: trendyol });
    const res = await agent.post(`/api/marketplace-accounts/${ok.body.account.id}/test`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, status: "CONNECTED" });
    expect((await agent.get("/api/marketplace-accounts")).body.accounts[0].status).toBe("CONNECTED");

    const hb = await agent
      .post("/api/marketplace-accounts")
      .send({ marketplace: "hepsiburada", config: { merchantId: "m" } });
    const bad = await agent.post(`/api/marketplace-accounts/${hb.body.account.id}/test`);
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe("MISSING_FIELDS");

    const n11 = await agent
      .post("/api/marketplace-accounts")
      .send({ marketplace: "n11", config: { appKey: "k", appSecret: "s" } });
    expect((await agent.post(`/api/marketplace-accounts/${n11.body.account.id}/test`)).body.message).toBeTruthy();
  });

  it("answers 503 CONFIG_MISSING when the encryption key is not configured", async () => {
    const agent = await t.signUp();
    delete process.env.CREDENTIALS_ENCRYPTION_KEY;
    const res = await agent.post("/api/marketplace-accounts").send({ marketplace: "trendyol", config: trendyol });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("CONFIG_MISSING");
  });

  it("ignores unknown and prototype-polluting keys", async () => {
    const agent = await t.signUp();
    const res = await agent
      .post("/api/marketplace-accounts")
      .send(
        JSON.parse(
          '{"marketplace":"n11","config":{"appKey":"k","__proto__":{"polluted":true},"constructor":"x","evil":"y"}}',
        ),
      );
    expect(res.status).toBe(201);
    expect(res.body.account.config).toEqual({ appKey: "••••" });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    const [row] = await t.db.select().from(marketplaceAccounts);
    expect(decryptJson(row.encryptedCredentials!)).toEqual({ appKey: "k" });
  });

  it("rate limits the account endpoints", async () => {
    const agent = await t.signUp();
    let last = 200;
    for (let i = 0; i < 61; i++) last = (await agent.get("/api/marketplace-accounts")).status;
    expect(last).toBe(429);
  });
});
