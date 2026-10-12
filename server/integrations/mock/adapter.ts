import {
  ADAPTER_METHODS,
  NotSupportedError,
  type AdapterMethod,
  type MarketplaceAdapter,
  type MarketplaceClaim,
  type MarketplaceCode,
  type MarketplaceOrder,
  type MarketplaceProduct,
  type MarketplaceQuestion,
  type MarketplaceSettlement,
  type Page,
  type PageRequest,
} from "../types";

export interface MockAdapterOptions {
  code?: MarketplaceCode;
  /** Defaults to every method. */
  capabilities?: AdapterMethod[];
  orders?: MarketplaceOrder[];
  products?: MarketplaceProduct[];
  questions?: MarketplaceQuestion[];
  claims?: MarketplaceClaim[];
  settlements?: MarketplaceSettlement[];
}

function paginate<T>(all: T[], query: PageRequest = {}): Page<T> {
  const size = query.pageSize && query.pageSize > 0 ? query.pageSize : 50;
  const start = query.cursor ? Number(query.cursor) : 0;
  const end = start + size;
  return { items: all.slice(start, end), nextCursor: end < all.length ? String(end) : undefined };
}

/** In-memory adapter for tests. Never touches the network. */
export function createMockAdapter(options: MockAdapterOptions = {}): MarketplaceAdapter {
  const capabilities = new Set<AdapterMethod>(options.capabilities ?? ADAPTER_METHODS);
  const code = options.code ?? "trendyol";
  const orders = structuredClone(options.orders ?? []);
  const products = structuredClone(options.products ?? []);
  const questions = structuredClone(options.questions ?? []);
  const claims = structuredClone(options.claims ?? []);
  const settlements = structuredClone(options.settlements ?? []);

  const require = (method: AdapterMethod) => {
    if (!capabilities.has(method)) throw new NotSupportedError(code, method);
  };

  return {
    code,
    capabilities,
    async fetchOrders(query = {}) {
      require("fetchOrders");
      const filtered = orders.filter(
        (o) =>
          (!query.status || o.status === query.status) &&
          (query.from === undefined || o.createdAt >= query.from) &&
          (query.to === undefined || o.createdAt <= query.to),
      );
      return paginate(filtered, query);
    },
    async fetchProducts(query) {
      require("fetchProducts");
      return paginate(products, query);
    },
    async updateStockPrice(updates, opts = {}) {
      require("updateStockPrice");
      const dryRun = opts.dryRun === true;
      if (!dryRun) {
        for (const u of updates) {
          const p = products.find((x) => x.barcode === u.barcode);
          if (!p) continue;
          if (u.stock !== undefined) p.stock = u.stock;
          if (u.price !== undefined) p.price = u.price;
        }
      }
      return { dryRun, applied: !dryRun };
    },
    async updateOrderStatus(update, opts = {}) {
      require("updateOrderStatus");
      const dryRun = opts.dryRun === true;
      if (!dryRun) {
        const o = orders.find((x) => x.externalId === update.externalId);
        if (o) o.status = update.status;
      }
      return { dryRun, applied: !dryRun };
    },
    async fetchQuestions(query) {
      require("fetchQuestions");
      return paginate(questions, query);
    },
    async answerQuestion(answer, opts = {}) {
      require("answerQuestion");
      const dryRun = opts.dryRun === true;
      if (!dryRun) {
        const q = questions.find((x) => x.externalId === answer.externalId);
        if (q) {
          q.status = "ANSWERED";
          q.answer = answer.answer;
        }
      }
      return { dryRun, applied: !dryRun };
    },
    async fetchClaims(query) {
      require("fetchClaims");
      return paginate(claims, query);
    },
    async fetchSettlements(query) {
      require("fetchSettlements");
      return paginate(settlements, query);
    },
  };
}
