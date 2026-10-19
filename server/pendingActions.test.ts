import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { orderEvents, pendingActions, tenants, users } from "./db/schema";
import { createExpirePendingActionsJob } from "./jobs/expirePendingActions";
import { createMockAdapter } from "./integrations/mock/adapter";
import type { MarketplaceAdapter } from "./integrations/types";
import { evaluateAction } from "./services/safetyGuard";
import {
  PENDING_ACTION_TTL_MS,
  expirePendingActions,
  submitAction,
  unavailableAdapterResolver,
  type AdapterResolver,
} from "./services/pendingActions";
import { createTestApp } from "./testApp";

const product = { externalId: "p1", barcode: "B1", merchantSku: "S1", title: "Ürün", price: 100, stock: 10 };

let adapter: MarketplaceAdapter;
let writes: Mock<(kind: string, dryRun: boolean) => void>;
let resolve: AdapterResolver;
let t: Awaited<ReturnType<typeof createTestApp>>;

beforeEach(async () => {
  const inner = createMockAdapter({
    products: [product],
    orders: [
      {
        externalId: "100",
        orderNumber: "ORD-1",
        status: "Created",
        currencyCode: "TRY",
        totalPrice: 1,
        lines: [],
        createdAt: 1,
      },
    ],
  });
  writes = vi.fn<(kind: string, dryRun: boolean) => void>();
  adapter = {
    ...inner,
    updateStockPrice: async (u, o) => {
      writes("stockPrice", o?.dryRun === true);
      return inner.updateStockPrice(u, o);
    },
    updateOrderStatus: async (u, o) => {
      writes("orderStatus", o?.dryRun === true);
      return inner.updateOrderStatus(u, o);
    },
    answerQuestion: async (a, o) => {
      writes("answer", o?.dryRun === true);
      return inner.answerQuestion(a, o);
    },
  };
  resolve = () => adapter;
  t = await createTestApp({ resolveAdapter: (target) => resolve(target) });
});

afterEach(async () => {
  await t.close();
});

async function setup(email = "owner@example.com") {
  const agent = await t.signUp(email);
  const [u] = await t.db.select().from(users).where(eq(users.email, email));
  return { agent, tenantId: u.tenantId, userId: u.id };
}

const ctx = (s: { tenantId: string; userId: string }) => ({
  tenantId: s.tenantId,
  userId: s.userId,
  accountId: null,
  marketplace: "trendyol" as const,
});

const bigDrop = {
  type: "UPDATE_STOCK_PRICE" as const,
  updates: [{ barcode: "B1", price: 60, currentPrice: 100 }],
};

describe("evaluateAction", () => {
  it("requires approval for price drops above the threshold only", () => {
    expect(evaluateAction(bigDrop).decision).toBe("REQUIRE_APPROVAL");
    const small = { type: "UPDATE_STOCK_PRICE" as const, updates: [{ barcode: "B1", price: 80, currentPrice: 100 }] };
    expect(evaluateAction(small).decision).toBe("ALLOW");
    expect(evaluateAction(small, { priceDropThresholdPct: 10 }).decision).toBe("REQUIRE_APPROVAL");
    const raise = { type: "UPDATE_STOCK_PRICE" as const, updates: [{ barcode: "B1", price: 500, currentPrice: 100 }] };
    expect(evaluateAction(raise).decision).toBe("ALLOW");
  });

  it("fails safe when the current price is unknown", () => {
    const d = evaluateAction({ type: "UPDATE_STOCK_PRICE", updates: [{ barcode: "B1", price: 10 }] });
    expect(d.decision).toBe("REQUIRE_APPROVAL");
  });

  it("requires approval for zero stock, cancellation and customer messages", () => {
    expect(evaluateAction({ type: "UPDATE_STOCK_PRICE", updates: [{ barcode: "B1", stock: 0 }] }).decision).toBe(
      "REQUIRE_APPROVAL",
    );
    expect(evaluateAction({ type: "UPDATE_STOCK_PRICE", updates: [{ barcode: "B1", stock: 5 }] }).decision).toBe(
      "ALLOW",
    );
    const status = { type: "UPDATE_ORDER_STATUS" as const, externalId: "100", orderNumber: "ORD-1" };
    expect(evaluateAction({ ...status, status: "Cancelled" }).decision).toBe("REQUIRE_APPROVAL");
    expect(evaluateAction({ ...status, status: "Picking" }).decision).toBe("ALLOW");
    expect(evaluateAction({ type: "ANSWER_QUESTION", externalId: "q", answer: "a" }).decision).toBe("REQUIRE_APPROVAL");
  });
});

describe("submitAction", () => {
  it("parks a risky action without calling the adapter", async () => {
    const s = await setup();
    const res = await submitAction(t.db, ctx(s), bigDrop, resolve);
    expect(res.outcome).toBe("PENDING");
    expect(res.action.status).toBe("PENDING");
    expect(writes).not.toHaveBeenCalled();
  });

  it("runs a safe action immediately: dry run first, then the real call", async () => {
    const s = await setup();
    const safe = { type: "UPDATE_STOCK_PRICE" as const, updates: [{ barcode: "B1", price: 95, currentPrice: 100 }] };
    const res = await submitAction(t.db, ctx(s), safe, resolve);
    expect(res.outcome).toBe("EXECUTED");
    expect(writes.mock.calls).toEqual([
      ["stockPrice", true],
      ["stockPrice", false],
    ]);
  });

  it("uses the tenant's own threshold", async () => {
    const s = await setup();
    await t.db.update(tenants).set({ priceDropThresholdPct: 5 }).where(eq(tenants.id, s.tenantId));
    const small = { type: "UPDATE_STOCK_PRICE" as const, updates: [{ barcode: "B1", price: 90, currentPrice: 100 }] };
    expect((await submitAction(t.db, ctx(s), small, resolve)).outcome).toBe("PENDING");
  });

  it("marks the row FAILED when no adapter is registered", async () => {
    const s = await setup();
    const res = await submitAction(
      t.db,
      ctx(s),
      { type: "UPDATE_ORDER_STATUS", externalId: "100", orderNumber: "ORD-1", status: "Picking" },
      unavailableAdapterResolver,
    );
    expect(res.outcome).toBe("FAILED");
    expect(res.action.error).toMatch(/adaptör/);
  });
});

describe("approval API", () => {
  it("lists, approves exactly once and refuses a second approval", async () => {
    const s = await setup();
    const { action } = await submitAction(t.db, ctx(s), bigDrop, resolve);

    const list = await s.agent.get("/api/pending-actions?status=PENDING");
    expect(list.body.actions.map((a: { id: string }) => a.id)).toEqual([action.id]);

    const first = await s.agent.post(`/api/pending-actions/${action.id}/approve`);
    expect(first.status).toBe(200);
    expect(first.body.action.status).toBe("EXECUTED");
    expect(writes.mock.calls).toEqual([
      ["stockPrice", true],
      ["stockPrice", false],
    ]);

    const second = await s.agent.post(`/api/pending-actions/${action.id}/approve`);
    expect(second.status).toBe(409);
    expect(writes).toHaveBeenCalledTimes(2);
  });

  it("runs once even when two approvals race", async () => {
    const s = await setup();
    const { action } = await submitAction(t.db, ctx(s), bigDrop, resolve);
    const results = await Promise.all([
      s.agent.post(`/api/pending-actions/${action.id}/approve`),
      s.agent.post(`/api/pending-actions/${action.id}/approve`),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(writes).toHaveBeenCalledTimes(2);
  });

  it("does not run a rejected action", async () => {
    const s = await setup();
    const { action } = await submitAction(t.db, ctx(s), bigDrop, resolve);
    const res = await s.agent.post(`/api/pending-actions/${action.id}/reject`);
    expect(res.body.action.status).toBe("REJECTED");
    expect((await s.agent.post(`/api/pending-actions/${action.id}/approve`)).status).toBe(409);
    expect(writes).not.toHaveBeenCalled();
  });

  it("hides and protects another tenant's actions", async () => {
    const a = await setup("a@example.com");
    const b = await setup("b@example.com");
    const { action } = await submitAction(t.db, ctx(a), bigDrop, resolve);

    expect((await b.agent.get("/api/pending-actions")).body.actions).toEqual([]);
    expect((await b.agent.post(`/api/pending-actions/${action.id}/approve`)).status).toBe(404);
    expect((await b.agent.post(`/api/pending-actions/${action.id}/reject`)).status).toBe(404);
    expect(writes).not.toHaveBeenCalled();
    const [row] = await t.db.select().from(pendingActions);
    expect(row.status).toBe("PENDING");
  });

  it("validates ids and status filters and requires a session", async () => {
    const s = await setup();
    expect((await s.agent.post("/api/pending-actions/not-a-uuid/approve")).status).toBe(404);
    expect((await s.agent.post("/api/pending-actions/not-a-uuid/reject")).status).toBe(404);
    expect((await s.agent.get("/api/pending-actions?status=BOGUS")).status).toBe(400);
    const { default: request } = await import("supertest");
    expect((await request(t.app).get("/api/pending-actions")).status).toBe(401);
  });

  it("writes an order event for order status decisions", async () => {
    const s = await setup();
    const cancel = {
      type: "UPDATE_ORDER_STATUS" as const,
      externalId: "100",
      orderNumber: "ORD-1",
      status: "Cancelled" as const,
    };
    const { action } = await submitAction(t.db, ctx(s), cancel, resolve);
    await s.agent.post(`/api/pending-actions/${action.id}/approve`);
    const events = await t.db.select().from(orderEvents);
    expect(events.map((e) => e.toStatus)).toEqual(["Cancelled"]);
    expect(events[0].eventSource).toBe("USER_ACTION");
  });
});

describe("expiry", () => {
  it("expires overdue items; they can no longer be approved or run", async () => {
    const s = await setup();
    const now = new Date();
    const { action } = await submitAction(t.db, ctx(s), bigDrop, resolve, now);
    const later = new Date(now.getTime() + PENDING_ACTION_TTL_MS + 1000);

    // Even before the job runs, an overdue item cannot be approved.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(later);
    const late = await s.agent.post(`/api/pending-actions/${action.id}/approve`);
    vi.useRealTimers();
    expect(late.status).toBe(409);

    expect(await expirePendingActions(t.db, later)).toBe(1);
    expect(await expirePendingActions(t.db, later)).toBe(0);
    const [row] = await t.db.select().from(pendingActions);
    expect(row.status).toBe("EXPIRED");
    expect(writes).not.toHaveBeenCalled();
  });

  it("is wired as a cron job", async () => {
    const s = await setup();
    const job = createExpirePendingActionsJob(t.db);
    expect(job.name).toBe("expire-pending-actions");
    expect(job.cron).toBeDefined();
    const logs: string[] = [];
    await submitAction(t.db, ctx(s), bigDrop, resolve, new Date(Date.now() - PENDING_ACTION_TTL_MS - 5000));
    await job.handler({}, { log: (m) => logs.push(m) });
    expect(logs).toEqual(["expired 1 pending action(s)"]);
    await job.handler({}, { log: (m) => logs.push(m) });
    expect(logs).toHaveLength(1);
  });
});
