import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestApp } from "./testApp";

type TestApp = Awaited<ReturnType<typeof createTestApp>>;
type Agent = Awaited<ReturnType<TestApp["signUp"]>>;

let t: TestApp;
// Signed-in client for a fresh tenant; the endpoint tests below all go through it.
let app: Agent;

beforeEach(async () => {
  t = await createTestApp();
  app = await t.signUp();
});

afterEach(() => t.close());

const webhook = (overrides: Record<string, unknown> = {}) => ({
  marketplace: "trendyol",
  eventType: "shipment-package.status-changed",
  orderId: 123456789,
  orderNumber: "TEST-0001",
  newStatus: "Shipped",
  idempotencyKey: "test-key-1",
  ...overrides,
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await app.get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("POST /api/webhooks/simulate", () => {
  it("rejects a webhook with missing fields", async () => {
    const res = await app.post("/api/webhooks/simulate").send({ marketplace: "trendyol" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("writes a new webhook to the event store", async () => {
    const res = await app.post("/api/webhooks/simulate").send(webhook());
    expect(res.status).toBe(200);
    expect(res.body.deduplicated).toBe(false);
    expect(res.body.event).toMatchObject({ orderNumber: "TEST-0001", toStatus: "Shipped", eventSource: "WEBHOOK" });

    const events = await app.get("/api/orders/events").query({ orderId: 123456789 });
    expect(events.body.events).toHaveLength(1);
    expect(events.body.events[0].idempotencyKey).toBe("test-key-1");
  });

  it("ignores a duplicate webhook with the same idempotency key", async () => {
    await app.post("/api/webhooks/simulate").send(webhook());
    const dup = await app.post("/api/webhooks/simulate").send(webhook());

    expect(dup.status).toBe(200);
    expect(dup.body.deduplicated).toBe(true);
    expect(dup.body.log.status).toBe("DUPLICATE_IGNORED");

    const events = await app.get("/api/orders/events").query({ orderId: 123456789 });
    expect(events.body.events).toHaveLength(1);

    const logs = await app.get("/api/webhooks/logs");
    const statuses = logs.body.logs.filter((l: any) => l.idempotencyKey === "test-key-1").map((l: any) => l.status);
    expect(statuses).toEqual(["DUPLICATE_IGNORED", "SUCCESS"]);
  });

  it("treats keys that were seeded at startup as already processed", async () => {
    const res = await app
      .post("/api/webhooks/simulate")
      .send(webhook({ idempotencyKey: "ty-pkg-created-914028471-v1" }));
    expect(res.body.deduplicated).toBe(true);
  });
});

describe("GET /api/orders/events", () => {
  it("returns all events newest first", async () => {
    const res = await app.get("/api/orders/events");
    const times = res.body.events.map((e: any) => e.createdAt);
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });
});

describe("tenant isolation of the event store", () => {
  it("does not leak events, logs or idempotency keys between tenants", async () => {
    await app.post("/api/webhooks/simulate").send(webhook());

    const other = await t.signUp("other@example.com");
    const events = await other.get("/api/orders/events").query({ orderId: 123456789 });
    expect(events.body.events).toHaveLength(0);

    const logs = await other.get("/api/webhooks/logs");
    expect(logs.body.logs.some((l: any) => l.idempotencyKey === "test-key-1")).toBe(false);

    const res = await other.post("/api/webhooks/simulate").send(webhook());
    expect(res.body.deduplicated).toBe(false);

    // Tenant A still sees exactly its own single event.
    const mine = await app.get("/api/orders/events").query({ orderId: 123456789 });
    expect(mine.body.events).toHaveLength(1);
  });
});

describe("AI endpoints without GEMINI_API_KEY", () => {
  it("suggest-reply falls back to the template", async () => {
    const res = await app
      .post("/api/ai/suggest-reply")
      .send({ question: "Kargo ne zaman gelir?", productName: "Test Ürün", customerName: "Ayşe" });
    expect(res.status).toBe(200);
    expect(res.body.source).toBe("template");
    expect(res.body.answer).toContain("Ayşe");
  });

  it("copilot falls back to rules", async () => {
    const res = await app.post("/api/ai/copilot").send({ prompt: "stok durumu" });
    expect(res.body.source).toBe("rules");
  });
});

describe("POST /api/trendyol/verify-credentials", () => {
  it("requires all credential fields", async () => {
    const res = await app.post("/api/trendyol/verify-credentials").send({ supplierId: "1" });
    expect(res.status).toBe(400);
  });

  it("returns store info for complete credentials", async () => {
    const res = await app
      .post("/api/trendyol/verify-credentials")
      .send({ supplierId: "123", apiKey: "k", apiSecret: "s" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, storeName: "Mağaza #123" });
  });
});

describe("POST /api/orders/reconcile", () => {
  it("returns the reconciliation summary", async () => {
    const res = await app.post("/api/orders/reconcile");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.discrepanciesFound).toBe(res.body.discrepancies.length);
  });
});

describe("GET /api/orders/events filtering", () => {
  it("filters by orderId", async () => {
    const res = await app.get("/api/orders/events").query({ orderId: 914028471 });
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].orderNumber).toBe("9482019481");
  });
});

describe("rate limiting on POST /api/trendyol/verify-credentials", () => {
  it("returns 429 with Retry-After after too many requests", async () => {
    const body = { supplierId: "1", apiKey: "k", apiSecret: "s" };
    for (let i = 0; i < 10; i++) {
      const ok = await app.post("/api/trendyol/verify-credentials").send(body);
      expect(ok.status).toBe(200);
    }
    const limited = await app.post("/api/trendyol/verify-credentials").send(body);
    expect(limited.status).toBe(429);
    expect(limited.body.success).toBe(false);
    expect(limited.headers["retry-after"]).toBeDefined();
  });
});
