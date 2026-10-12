import { describe, expect, it } from "vitest";
import { ADAPTER_METHODS, NotSupportedError, type MarketplaceAdapter } from "./types";

/**
 * Contract suite every marketplace adapter must pass. The factory must return an
 * adapter backed by mocked HTTP (never a real marketplace) and seeded with at least
 * one order, product and question so the dry-run checks can observe state.
 */
export function runAdapterContractTests(name: string, factory: () => MarketplaceAdapter) {
  describe(`${name} adapter contract`, () => {
    it("exposes a code and capabilities that are known methods", () => {
      const a = factory();
      expect(a.code).toBeTruthy();
      for (const m of a.capabilities) expect(ADAPTER_METHODS).toContain(m);
    });

    it("implements all eight methods", () => {
      const a = factory();
      for (const m of ADAPTER_METHODS) expect(typeof a[m]).toBe("function");
    });

    it("unsupported methods throw NotSupportedError, supported ones do not", async () => {
      const a = factory();
      const calls = {
        fetchOrders: () => a.fetchOrders(),
        fetchProducts: () => a.fetchProducts(),
        updateStockPrice: () => a.updateStockPrice([], { dryRun: true }),
        updateOrderStatus: () => a.updateOrderStatus({ externalId: "x", status: "Picking" }, { dryRun: true }),
        fetchQuestions: () => a.fetchQuestions(),
        answerQuestion: () => a.answerQuestion({ externalId: "x", answer: "x" }, { dryRun: true }),
        fetchClaims: () => a.fetchClaims(),
        fetchSettlements: () => a.fetchSettlements(),
      } as const;
      for (const m of ADAPTER_METHODS) {
        if (a.capabilities.has(m)) await expect(calls[m]()).resolves.toBeDefined();
        else await expect(calls[m]()).rejects.toBeInstanceOf(NotSupportedError);
      }
    });

    it("paginates with cursors until nextCursor is absent", async () => {
      const a = factory();
      if (!a.capabilities.has("fetchProducts")) return;
      const seen: string[] = [];
      let cursor: string | undefined;
      for (let i = 0; i < 1000; i++) {
        const page = await a.fetchProducts({ cursor, pageSize: 1 });
        seen.push(...page.items.map((p) => p.externalId));
        cursor = page.nextCursor;
        if (!cursor) break;
      }
      expect(cursor).toBeUndefined();
      expect(new Set(seen).size).toBe(seen.length);
    });

    it("write methods change nothing with dryRun: true", async () => {
      const a = factory();
      if (a.capabilities.has("updateStockPrice") && a.capabilities.has("fetchProducts")) {
        const before = (await a.fetchProducts()).items;
        expect(before.length).toBeGreaterThan(0);
        const res = await a.updateStockPrice([{ barcode: before[0].barcode, stock: 0, price: 1 }], { dryRun: true });
        expect(res).toEqual({ dryRun: true, applied: false });
        expect((await a.fetchProducts()).items).toEqual(before);
      }
      if (a.capabilities.has("updateOrderStatus") && a.capabilities.has("fetchOrders")) {
        const before = (await a.fetchOrders()).items;
        expect(before.length).toBeGreaterThan(0);
        const res = await a.updateOrderStatus(
          { externalId: before[0].externalId, status: "Cancelled" },
          { dryRun: true },
        );
        expect(res).toEqual({ dryRun: true, applied: false });
        expect((await a.fetchOrders()).items).toEqual(before);
      }
      if (a.capabilities.has("answerQuestion") && a.capabilities.has("fetchQuestions")) {
        const before = (await a.fetchQuestions()).items;
        expect(before.length).toBeGreaterThan(0);
        const res = await a.answerQuestion({ externalId: before[0].externalId, answer: "test" }, { dryRun: true });
        expect(res).toEqual({ dryRun: true, applied: false });
        expect((await a.fetchQuestions()).items).toEqual(before);
      }
    });
  });
}
