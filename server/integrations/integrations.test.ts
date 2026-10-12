import { describe, expect, it } from "vitest";
import { runAdapterContractTests } from "./contract";
import { createMockAdapter, type MockAdapterOptions } from "./mock/adapter";
import { createAdapterRegistry } from "./registry";
import { AdapterNotRegisteredError, NotSupportedError, UnknownMarketplaceError, type MarketplaceOrder } from "./types";

const order = (i: number, status: MarketplaceOrder["status"] = "Created"): MarketplaceOrder => ({
  externalId: `o${i}`,
  orderNumber: `N${i}`,
  status,
  currencyCode: "TRY",
  totalPrice: 100,
  lines: [],
  createdAt: 1000 * i,
});

const seed: MockAdapterOptions = {
  orders: [order(1), order(2, "Picking"), order(3)],
  products: [1, 2, 3].map((i) => ({
    externalId: `p${i}`,
    barcode: `b${i}`,
    merchantSku: `s${i}`,
    title: `Ürün ${i}`,
    price: 50,
    stock: 10,
  })),
  questions: [{ externalId: "q1", text: "Kargo kaç günde?", status: "WAITING", createdAt: 1 }],
};

runAdapterContractTests("mock (all capabilities)", () => createMockAdapter(seed));
runAdapterContractTests("mock (read-only)", () =>
  createMockAdapter({ ...seed, capabilities: ["fetchOrders", "fetchProducts", "fetchQuestions"] }),
);

describe("mock adapter", () => {
  it("applies writes when dryRun is not set", async () => {
    const a = createMockAdapter(seed);
    expect(
      await a.updateStockPrice([
        { barcode: "b1", stock: 3, price: 60 },
        { barcode: "yok", stock: 1 },
      ]),
    ).toEqual({
      dryRun: false,
      applied: true,
    });
    expect((await a.fetchProducts()).items[0]).toMatchObject({ stock: 3, price: 60 });
    await a.updateOrderStatus({ externalId: "o1", status: "Picking" });
    expect((await a.fetchOrders({ status: "Picking" })).items).toHaveLength(2);
    await a.answerQuestion({ externalId: "q1", answer: "Yarın" });
    expect((await a.fetchQuestions()).items[0]).toMatchObject({ status: "ANSWERED", answer: "Yarın" });
  });

  it("filters orders by date range and pages with cursors", async () => {
    const a = createMockAdapter(seed);
    expect((await a.fetchOrders({ from: 2000, to: 3000 })).items.map((o) => o.externalId)).toEqual(["o2", "o3"]);
    const p1 = await a.fetchOrders({ pageSize: 2 });
    expect(p1.items).toHaveLength(2);
    const p2 = await a.fetchOrders({ pageSize: 2, cursor: p1.nextCursor });
    expect(p2.items).toHaveLength(1);
    expect(p2.nextCursor).toBeUndefined();
  });

  it("serves claims and settlements", async () => {
    const a = createMockAdapter({
      claims: [{ externalId: "c1", orderNumber: "N1", status: "Created", reason: "x", createdAt: 1 }],
      settlements: [{ externalId: "s1", type: "Sale", amount: 1, currencyCode: "TRY", date: 1 }],
    });
    expect((await a.fetchClaims()).items).toHaveLength(1);
    expect((await a.fetchSettlements()).items).toHaveLength(1);
  });

  it("throws NotSupportedError for methods outside capabilities", async () => {
    const a = createMockAdapter({ capabilities: ["fetchOrders"] });
    await expect(a.fetchSettlements()).rejects.toBeInstanceOf(NotSupportedError);
    await expect(a.fetchSettlements()).rejects.toThrow(/fetchSettlements/);
  });
});

describe("adapter registry", () => {
  it("creates a registered adapter", () => {
    const registry = createAdapterRegistry<{ accountId: string }>();
    registry.register("trendyol", () => createMockAdapter({ code: "trendyol" }));
    expect(registry.create("trendyol", { accountId: "a" }).code).toBe("trendyol");
  });

  it("rejects unknown marketplace codes explicitly", () => {
    const registry = createAdapterRegistry();
    expect(() => registry.create("amazon", undefined)).toThrow(UnknownMarketplaceError);
  });

  it("rejects known codes without a registered adapter", () => {
    const registry = createAdapterRegistry();
    expect(() => registry.create("n11", undefined)).toThrow(AdapterNotRegisteredError);
  });

  it("keeps registries isolated", () => {
    const a = createAdapterRegistry();
    const b = createAdapterRegistry();
    a.register("ikas", () => createMockAdapter({ code: "ikas" }));
    expect(() => b.create("ikas", undefined)).toThrow(AdapterNotRegisteredError);
  });
});
