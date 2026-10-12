import type { MarketplaceType, PackageStatus } from "../../src/types";

export type MarketplaceCode = Extract<MarketplaceType, "trendyol" | "hepsiburada" | "n11" | "ikas">;
export const MARKETPLACE_CODES: readonly MarketplaceCode[] = ["trendyol", "hepsiburada", "n11", "ikas"];

export type AdapterMethod =
  | "fetchOrders"
  | "fetchProducts"
  | "updateStockPrice"
  | "updateOrderStatus"
  | "fetchQuestions"
  | "answerQuestion"
  | "fetchClaims"
  | "fetchSettlements";

export const ADAPTER_METHODS: readonly AdapterMethod[] = [
  "fetchOrders",
  "fetchProducts",
  "updateStockPrice",
  "updateOrderStatus",
  "fetchQuestions",
  "answerQuestion",
  "fetchClaims",
  "fetchSettlements",
];

export interface PageRequest {
  /** Opaque cursor from a previous page's `nextCursor`. */
  cursor?: string;
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  /** Absent on the last page. */
  nextCursor?: string;
}

/** Safety brake: with `dryRun: true` a write method must change nothing. */
export interface WriteOptions {
  dryRun?: boolean;
}

export interface WriteResult {
  dryRun: boolean;
  applied: boolean;
}

export interface OrdersQuery extends PageRequest {
  status?: PackageStatus;
  /** Epoch ms, inclusive. */
  from?: number;
  to?: number;
}

export interface MarketplaceOrderLine {
  barcode: string;
  merchantSku: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface MarketplaceOrder {
  externalId: string;
  orderNumber: string;
  status: PackageStatus;
  currencyCode: string;
  totalPrice: number;
  lines: MarketplaceOrderLine[];
  createdAt: number;
}

export interface MarketplaceProduct {
  externalId: string;
  barcode: string;
  merchantSku: string;
  title: string;
  price: number;
  stock: number;
}

export interface MarketplaceQuestion {
  externalId: string;
  text: string;
  productBarcode?: string;
  status: "WAITING" | "ANSWERED";
  answer?: string;
  createdAt: number;
}

export interface MarketplaceClaim {
  externalId: string;
  orderNumber: string;
  status: string;
  reason: string;
  createdAt: number;
}

export interface MarketplaceSettlement {
  externalId: string;
  orderNumber?: string;
  type: string;
  amount: number;
  currencyCode: string;
  date: number;
}

export interface StockPriceUpdate {
  barcode: string;
  stock?: number;
  price?: number;
}

export interface OrderStatusUpdate {
  externalId: string;
  status: PackageStatus;
  invoiceNumber?: string;
}

export interface QuestionAnswer {
  externalId: string;
  answer: string;
}

export interface MarketplaceAdapter {
  readonly code: MarketplaceCode;
  /** Methods this adapter implements; the rest throw `NotSupportedError`. */
  readonly capabilities: ReadonlySet<AdapterMethod>;
  fetchOrders(query?: OrdersQuery): Promise<Page<MarketplaceOrder>>;
  fetchProducts(query?: PageRequest): Promise<Page<MarketplaceProduct>>;
  updateStockPrice(updates: StockPriceUpdate[], options?: WriteOptions): Promise<WriteResult>;
  updateOrderStatus(update: OrderStatusUpdate, options?: WriteOptions): Promise<WriteResult>;
  fetchQuestions(query?: PageRequest): Promise<Page<MarketplaceQuestion>>;
  answerQuestion(answer: QuestionAnswer, options?: WriteOptions): Promise<WriteResult>;
  fetchClaims(query?: PageRequest): Promise<Page<MarketplaceClaim>>;
  fetchSettlements(query?: PageRequest): Promise<Page<MarketplaceSettlement>>;
}

export class NotSupportedError extends Error {
  constructor(
    readonly marketplace: MarketplaceCode,
    readonly method: AdapterMethod,
  ) {
    super(`${marketplace} adaptörü ${method} işlemini desteklemiyor.`);
    this.name = "NotSupportedError";
  }
}

export class UnknownMarketplaceError extends Error {
  constructor(code: string) {
    super(`Bilinmeyen pazaryeri kodu: ${code}`);
    this.name = "UnknownMarketplaceError";
  }
}

export class AdapterNotRegisteredError extends Error {
  constructor(code: MarketplaceCode) {
    super(`${code} için adaptör henüz kayıtlı değil.`);
    this.name = "AdapterNotRegisteredError";
  }
}
