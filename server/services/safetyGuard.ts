import type { StockPriceUpdate } from "../integrations/types";
import type { PackageStatus } from "../../src/types";

// Pure risk rules for outbound marketplace writes (ADR 0015). No I/O here.

export const DEFAULT_PRICE_DROP_THRESHOLD_PCT = 30;

export interface StockPriceItem extends StockPriceUpdate {
  /** Price currently on the marketplace; without it a price change cannot be judged. */
  currentPrice?: number;
}

export type OutboundAction =
  | { type: "UPDATE_STOCK_PRICE"; updates: StockPriceItem[] }
  | {
      type: "UPDATE_ORDER_STATUS";
      externalId: string;
      orderNumber: string;
      status: PackageStatus;
      invoiceNumber?: string;
    }
  | { type: "ANSWER_QUESTION"; externalId: string; answer: string };

export type GuardDecision = { decision: "ALLOW" } | { decision: "REQUIRE_APPROVAL"; reason: string };

export interface GuardOptions {
  priceDropThresholdPct?: number;
}

export function evaluateAction(action: OutboundAction, opts: GuardOptions = {}): GuardDecision {
  const threshold = opts.priceDropThresholdPct ?? DEFAULT_PRICE_DROP_THRESHOLD_PCT;
  switch (action.type) {
    case "UPDATE_STOCK_PRICE": {
      const reasons: string[] = [];
      for (const u of action.updates) {
        if (u.stock === 0) reasons.push(`${u.barcode}: stok sıfırlanıyor`);
        if (u.price === undefined) continue;
        if (u.currentPrice === undefined || u.currentPrice <= 0) {
          reasons.push(`${u.barcode}: mevcut fiyat bilinmiyor`);
        } else if (u.price < u.currentPrice) {
          const drop = ((u.currentPrice - u.price) / u.currentPrice) * 100;
          if (drop > threshold) reasons.push(`${u.barcode}: fiyat %${drop.toFixed(1)} düşüyor (eşik %${threshold})`);
        }
      }
      return reasons.length > 0 ? { decision: "REQUIRE_APPROVAL", reason: reasons.join("; ") } : { decision: "ALLOW" };
    }
    case "UPDATE_ORDER_STATUS":
      return action.status === "Cancelled"
        ? { decision: "REQUIRE_APPROVAL", reason: `Sipariş iptali: ${action.orderNumber}` }
        : { decision: "ALLOW" };
    case "ANSWER_QUESTION":
      return { decision: "REQUIRE_APPROVAL", reason: "Müşteriye mesaj gönderimi" };
  }
}
