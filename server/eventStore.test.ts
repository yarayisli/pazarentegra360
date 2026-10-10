import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { seedDemo } from "./db/seed";
import { createApp } from "./app";
import * as eventStore from "./services/eventStore";
import { createTestApp } from "./testApp";
import request from "supertest";

type TestApp = Awaited<ReturnType<typeof createTestApp>>;
let t: TestApp;

beforeEach(async () => {
  t = await createTestApp();
});
afterEach(() => t.close());

const input = (overrides: Partial<eventStore.WebhookInput> = {}): eventStore.WebhookInput => ({
  marketplace: "trendyol",
  eventType: "shipment-package.status-changed",
  orderNumber: "T-1",
  newStatus: "Shipped",
  orderId: 42,
  idempotencyKey: "same-key",
  ...overrides,
});

describe("event store persistence", () => {
  it("keeps events and logs when the app is recreated on the same database", async () => {
    const agent = await t.signUp();
    await agent.post("/api/webhooks/simulate").send(input());

    // A "restarted" server: new app instance, same database.
    const restarted = createApp({ db: t.db });
    const login = request.agent(restarted);
    const res = await login
      .post("/api/auth/login")
      .send({ email: "owner@example.com", password: "correct-horse-battery" });
    expect(res.status).toBe(200);
    const events = await login.get("/api/orders/events");
    expect(events.body.events).toHaveLength(1);
    const logs = await login.get("/api/webhooks/logs");
    expect(logs.body.logs).toHaveLength(1);
  });
});

describe("webhook idempotency", () => {
  it("10 concurrent identical webhooks produce exactly one event", async () => {
    const agent = await t.signUp();
    const [{ id: tenantId }] = await t.db.select().from((await import("./db/schema")).tenants);
    const results = await Promise.all(
      Array.from({ length: 10 }, () => eventStore.recordWebhook(t.db, tenantId, input())),
    );
    expect(results.filter((r) => !r.deduplicated)).toHaveLength(1);
    expect(results.filter((r) => r.deduplicated)).toHaveLength(9);

    const events = await agent.get("/api/orders/events");
    expect(events.body.events).toHaveLength(1);
    const logs = await agent.get("/api/webhooks/logs");
    expect(logs.body.logs.map((l: { status: string }) => l.status).sort()).toEqual([
      ...Array(9).fill("DUPLICATE_IGNORED"),
      "SUCCESS",
    ]);
  });

  it("derives a key when none is given and dedupes within the same minute", async () => {
    const agent = await t.signUp();
    const body = input({ idempotencyKey: undefined });
    const a = await agent.post("/api/webhooks/simulate").send(body);
    const b = await agent.post("/api/webhooks/simulate").send(body);
    expect(a.body.deduplicated).toBe(false);
    expect(b.body.deduplicated).toBe(true);
  });
});

describe("append-only order_events", () => {
  it("exposes no update or delete operations", () => {
    expect(Object.keys(eventStore).filter((k) => /update|delete|remove/i.test(k))).toEqual([]);
  });
});

describe("demo seed", () => {
  it("loads the sample events and webhook log for the demo tenant", async () => {
    const { tenantId } = await seedDemo(t.db);
    const events = await eventStore.listEvents(t.db, tenantId);
    expect(events.map((e) => e.orderNumber)).toEqual(["HB-74920194", "9482019481"]);
    const one = await eventStore.listEvents(t.db, tenantId, 914028471);
    expect(one).toHaveLength(1);
    expect(await eventStore.listWebhookLogs(t.db, tenantId)).toHaveLength(1);
  });

  it("treats seeded idempotency keys as already processed", async () => {
    const { tenantId } = await seedDemo(t.db);
    const res = await eventStore.recordWebhook(
      t.db,
      tenantId,
      input({ idempotencyKey: "ty-pkg-created-914028471-v1" }),
    );
    expect(res.deduplicated).toBe(true);
  });
});
