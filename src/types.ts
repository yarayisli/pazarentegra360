export type MarketplaceType = 'trendyol' | 'hepsiburada' | 'n11' | 'amazon_tr' | 'ikas';

export type PackageStatus =
  | 'Created'      // Yeni Sipariş
  | 'Picking'      // Toplanıyor / Hazırlanıyor
  | 'Invoiced'     // Faturalandı
  | 'Shipped'      // Kargoya Verildi
  | 'Delivered'    // Teslim Edildi
  | 'UnDelivered'  // Teslim Edilemedi
  | 'Returned'     // İade Edildi
  | 'Cancelled';   // İptal Edildi

export type EventSource = 
  | 'WEBHOOK' 
  | 'RECONCILIATION_JOB' 
  | 'USER_SCAN' 
  | 'MARKETPLACE_API' 
  | 'SYSTEM_CRON';

export interface OrderEvent {
  id: string;
  orderId: number;
  orderNumber: string;
  marketplace: MarketplaceType;
  fromStatus: PackageStatus | 'None';
  toStatus: PackageStatus;
  eventSource: EventSource;
  idempotencyKey: string;
  description: string;
  operatorName?: string;
  payloadSnapshot?: Record<string, any>;
  createdAt: number;
}

export interface WebhookLog {
  id: string;
  marketplace: MarketplaceType;
  eventType: string;
  idempotencyKey: string;
  status: 'SUCCESS' | 'DUPLICATE_IGNORED' | 'FAILED';
  receivedAt: number;
  processingTimeMs: number;
  payload: Record<string, any>;
  orderNumber?: string;
}

export interface ReconciliationDiscrepancy {
  orderId: number;
  orderNumber: string;
  marketplace: MarketplaceType;
  localStatus: PackageStatus;
  remoteStatus: PackageStatus;
  detectedAt: number;
  resolutionStatus: 'PENDING' | 'RESOLVED';
  reason: string;
}

export interface OrderItemLine {
  id: string;
  lineId: number;
  productName: string;
  barcode: string;
  merchantSku: string;
  quantity: number;
  price: number;
  vatBaseAmount: number;
  currencyCode: string;
  imageUrl: string;
  picked?: boolean;
}

export interface AddressInfo {
  fullName: string;
  address1: string;
  city: string;
  district: string;
  postalCode: string;
  phone: string;
  neighborhood?: string;
}

export interface PackageHistory {
  createdDate: number;
  status: PackageStatus | string;
  description: string;
}

export interface ShipmentPackage {
  id: number;
  orderNumber: string;
  packetNumber?: string;
  marketplace: MarketplaceType;
  packageStatus: PackageStatus;
  customerFirstName: string;
  customerLastName: string;
  customerId: string;
  customerEmail?: string;
  grossAmount: number;
  totalDiscount: number;
  totalPrice: number;
  cargoProviderName: string;
  cargoTrackingNumber: string;
  cargoTrackingLink: string;
  cargoBarcode: string;
  orderDate: number;
  agreedDeliveryDate: number; // SLA Deadlines
  fastDelivery: boolean;
  taxNumber?: string;
  invoiceNumber?: string;
  invoiceSerial?: string;
  invoiceDate?: string;
  shipmentAddress: AddressInfo;
  invoiceAddress: AddressInfo;
  lines: OrderItemLine[];
  packageHistories: PackageHistory[];
  commercialBoxCode?: string;
}

export interface ChannelStockInfo {
  active: boolean;
  price: number;
  stock: number;
  commissionRate: number;
  lastSync: string;
}

export interface ProductItem {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  category: string;
  brand: string;
  imageUrl: string;
  totalStock: number;
  reservedStock: number;
  buyingPrice: number;
  basePrice: number;
  vatRate: number;
  channels: {
    trendyol: ChannelStockInfo;
    hepsiburada: ChannelStockInfo;
    n11: ChannelStockInfo;
    ikas?: ChannelStockInfo;
  };
}

export interface CustomerQuestion {
  id: string;
  marketplace: MarketplaceType;
  customerName: string;
  productName: string;
  productBarcode: string;
  productImageUrl: string;
  question: string;
  questionDate: string;
  status: 'WAITING' | 'ANSWERED' | 'REJECTED';
  answer?: string;
  answeredAt?: string;
  orderNumber?: string;
}

export interface MarketplaceCredentials {
  trendyol: {
    supplierId: string;
    apiKey: string;
    apiSecret: string;
    isConnected: boolean;
    autoPicking: boolean;
    autoInvoice: boolean;
    testMode: boolean;
    webhookActive: boolean;
    storeName: string;
  };
  hepsiburada: {
    merchantId: string;
    serviceKey: string;
    isConnected: boolean;
    autoInvoice: boolean;
    testMode: boolean;
    storeName: string;
  };
  n11: {
    appKey: string;
    appSecret: string;
    isConnected: boolean;
    autoInvoice: boolean;
    testMode: boolean;
    storeName: string;
  };
  ikas?: {
    storeDomain: string; // ör. trendmoda.myikas.com
    apiClientId: string;
    apiClientSecret: string;
    isConnected: boolean;
    syncInventory: boolean;
    syncOrders: boolean;
    storeName: string;
  };
}

export interface CargoTrackingStep {
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
}

export type ReturnInspectionFault = 
  | 'CARGO_DAMAGE'      // Kargo / Taşıma Hasarı
  | 'WRONG_ITEM'         // Yanlış Ürün Gönderimi
  | 'DEFECTIVE_PRODUCT'  // Kusurlu / Arızalı Ürün
  | 'RIGHT_OF_WITHDRAWAL'// Cayma Hakkı / Beğenmeme / Vazgeçme
  | 'SIZE_MISMATCH';     // Kalıp / Beden Uyumsuzluğu

export type ReturnCondition = 
  | 'RE_SELLABLE'        // Tekrar Satışa Uygun (Stoka Al)
  | 'DAMAGED_SCRAP'      // Hurda / Çöp / Kullanılamaz
  | 'SUPPLIER_RETURN';   // Tedarikçiye İade Edilecek

export interface ReturnRecord {
  id: string;
  orderNumber: string;
  packageId: number;
  marketplace: MarketplaceType;
  claimNumber: string;
  customerName: string;
  productName: string;
  barcode: string;
  sku: string;
  quantity: number;
  claimDate: number;
  status: 'CLAIM_CREATED' | 'IN_TRANSIT' | 'ARRIVED_AT_WAREHOUSE' | 'INSPECTED' | 'REFUNDED' | 'DISPUTED';
  trackingCode: string;
  carrierName: string;
  claimReason: string;
  faultCategory?: ReturnInspectionFault;
  condition?: ReturnCondition;
  warehouseNote?: string;
  inspectedAt?: number;
  restocked: boolean;
  refundAmount: number;
  disputeReason?: string;
}

export interface SKUProfitability {
  sku: string;
  barcode: string;
  name: string;
  salePrice: number;
  cogs: number; // Ürün Maliyeti
  commissionRate: number;
  commissionAmount: number;
  shippingCost: number; // Kargo / Desi Masrafı
  packagingCost: number; // Koli & Ambalaj
  adCostPerUnit: number; // Reklam / PPC Payı
  taxAndWithholding: number; // KDV / Stopaj
  returnLossPerUnit: number; // İade Oranı Masrafı
  netContributionMargin: number; // Net Katkı Payı
  marginPercentage: number; // % Marj
  monthlySalesQty: number;
  totalNetProfit: number;
  isLossMaking: boolean;
  recommendation: string;
}

export interface StockDemandForecast {
  sku: string;
  barcode: string;
  name: string;
  currentStock: number;
  reservedStock: number;
  dailyVelocity: number; // Günlük Satış Hızı (adet/gün)
  runoutDays: number; // Tahmini Stok Tükenme Günü
  leadTimeDays: number; // Tedarik Süresi
  safetyStock: number; // Emniyet Stoğu
  suggestedReorderQty: number; // Önerilen Sipariş Miktarı (PO)
  abcCategory: 'A' | 'B' | 'C'; // Pareto Sınıfı
  riskLevel: 'CRITICAL_RUNOUT' | 'ORDER_NOW' | 'OPTIMAL' | 'OVERSTOCKED' | 'DEAD_STOCK';
}

// WMS (Depo & Raf Yönetimi, Batch Picking, Seri/Lot Takibi)
export interface WarehouseLocation {
  id: string;
  warehouseCode: string; // 'ANA_DEPO' | 'LOKAL_DEPO'
  zone: string; // 'A' | 'B' | 'SOĞUK_HAVA'
  aisle: string; // '01', '02', '03'
  rack: string; // 'R1', 'R2'
  shelf: string; // '01', '02', '03'
  bin: string; // 'A-02-R1-03'
  occupiedCapacityPct: number;
}

export interface ProductWarehouseDetail {
  sku: string;
  barcode: string;
  name: string;
  locationBin: string; // Raf Kodu: A-04-02
  warehouseCode: string;
  quantityOnHand: number;
  quantityAllocated: number;
  lotNumber?: string;
  serialNumbers?: string[];
  expirationDate?: string; // SKT YYYY-MM-DD
  requiresSerialScan: boolean;
}

export interface PickingBatchWave {
  id: string;
  waveNumber: string;
  batchName: string;
  assignedPicker: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  packageCount: number;
  totalItemsCount: number;
  pickedItemsCount: number;
  createdAt: number;
  items: {
    sku: string;
    barcode: string;
    name: string;
    binLocation: string; // Rota sırasına göre sıralı
    qtyNeeded: number;
    qtyPicked: number;
    orderNumbers: string[];
    isPicked: boolean;
  }[];
}

// Buybox & Dinamik Repricer (Fiyatlandırma Radarı)
export interface BuyboxCompetitor {
  sellerName: string;
  sellerRating: number;
  price: number;
  isBuyboxOwner: boolean;
  isFulfillmentByMarketplace: boolean; // Trendyol Express / Hepsiburada Lojistik
  shippingDays: number;
}

export interface BuyboxMonitorItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  marketplace: MarketplaceType;
  myCurrentPrice: number;
  minPriceFloor: number; // Asgari Fiyat (Zarar etmeme sınırı)
  maxPriceCeiling: number; // Azami Tavan Fiyat
  cogs: number;
  commissionRate: number;
  buyboxWinnerPrice: number;
  isWinningBuybox: boolean;
  strategy: 'MATCH_BUYBOX' | 'BEAT_BY_1TL' | 'PROFIT_MAXIMIZER' | 'MANUAL';
  autoRepriceEnabled: boolean;
  lastRepricedAt: number;
  competitors: BuyboxCompetitor[];
  priceHistory: { timestamp: number; price: number; trigger: string }[];
}

// Finansal Mutabakat & Hakediş Kesinti Denetçisi (Settlement Audit)
export type SettlementDiscrepancyType = 
  | 'COMMISSION_OVERCHARGE' // Fazla komisyon kesintisi (sözleşme %15, kesilen %18)
  | 'DESI_OVERCHARGE'       // Desi hırsızlığı / Kargo desi aşımı (Gerçek 2 desi, fatura 6 desi)
  | 'UNPAID_SETTLEMENT'     // Vadesi dolduğu halde hesaba geçmeyen bloke hakediş
  | 'WRONG_PENALTY'         // Hatalı tedarik edememe/gecikme cezası
  | 'REFUND_WITHOUT_RETURN';// Ürün depoya dönmeden müşteriye haksız iade bedeli aktarımı

export interface SettlementAuditRecord {
  id: string;
  orderNumber: string;
  marketplace: MarketplaceType;
  orderDate: string;
  settlementDate: string;
  sku: string;
  productName: string;
  grossAmount: number;
  expectedCommission: number;
  actualCommissionDeducted: number;
  expectedDesi: number;
  billedDesi: number;
  expectedCargoCost: number;
  billedCargoCost: number;
  discrepancyType: SettlementDiscrepancyType;
  discrepancyAmount: number; // Haksız kesinti tutarı (₺)
  claimStatus: 'OPEN_DISCREPANCY' | 'CLAIM_SUBMITTED' | 'REFUNDED_BY_MARKETPLACE' | 'REJECTED';
  claimTicketNumber?: string;
  claimNotes?: string;
}

// Akıllı Koli & 3D Paketleme Algoritması (Bin Packing Optimizer)
export interface StandardPackagingBox {
  id: string;
  code: string; // ör. KOLI-S, KOLI-M, BALONLU-ZARF
  name: string;
  innerDimensions: { width: number; length: number; height: number }; // cm
  maxWeightKg: number;
  boxDesi: number; // (W * L * H) / 3000
  boxCost: number; // Koli satın alma maliyeti ₺
  cargoBaseFee: number; // Bu desideki ortalama kargo taşıma ücreti ₺
  stockCount: number;
}

export interface PackingSimulationItem {
  sku: string;
  name: string;
  quantity: number;
  dimensions: { width: number; length: number; height: number }; // cm
  weightKg: number;
  isFragile?: boolean;
}

export interface PackingPlanResult {
  orderNumber: string;
  recommendedBox: StandardPackagingBox;
  suboptimalBoxAlternative?: StandardPackagingBox;
  volumeUtilizationPct: number; // % doluluk
  totalWeightKg: number;
  estimatedDesi: number;
  estimatedShippingCost: number;
  estimatedSavingsVsManual: number; // Yanlış büyük koli seçimine kıyasla kargo tasarrufu (₺)
  packingSteps: string[];
}

// Müşteri Yorum & İtibar Kalkanı (Review Sentiment & Reputation Shield)
export type ReviewSentimentType = 'VERY_NEGATIVE' | 'NEGATIVE' | 'NEUTRAL' | 'POSITIVE';
export type ReviewRootCause = 
  | 'CARGO_DAMAGE'         // Kargo ezik/kırık teslim etti
  | 'DEFECTIVE_PRODUCT'    // Ürün fabrikasyon bozuk/arızalı
  | 'WRONG_ITEM_SENT'      // Yanlış renk/model gönderildi
  | 'SIZE_FIT_MISMATCH'    // Kalıp dar/büyük geldi
  | 'USER_ERROR'           // Müşteri kurulumu yapamadı/kullanım hatası
  | 'HIGH_SATISFACTION';   // Kusursuz memnuniyet

export interface ProductReviewItem {
  id: string;
  orderNumber: string;
  marketplace: MarketplaceType;
  sku: string;
  productName: string;
  customerName: string;
  rating: number; // 1 - 5
  commentDate: string;
  commentText: string;
  sentiment: ReviewSentimentType;
  rootCause: ReviewRootCause;
  status: 'PENDING_ACTION' | 'RESOLVED' | 'DISPUTED_WITH_PLATFORM';
  sellerResponseDraft?: string;
  sellerResponseSent?: string;
  compensationAction?: {
    type: 'DISCOUNT_COUPON' | 'FREE_REPLACEMENT' | 'REFUND' | 'CALL_CUSTOMER';
    status: 'OFFERED' | 'ACCEPTED' | 'REJECTED';
    details: string;
  };
}

// ikas POS & Perakende Kasa Terminali (Hızlı Satış & Anlık Stok Senkronizasyonu)
export interface POSTerminalCartItem {
  product: ProductItem;
  quantity: number;
  discountRate: number; // % indirim
  finalUnitPrice: number;
}

export interface POSSaleReceipt {
  id: string;
  receiptNumber: string;
  saleTime: string;
  cashierName: string;
  customerName?: string;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'SPLIT_PAYMENT';
  items: {
    sku: string;
    name: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  syncedToMarketplaces: boolean;
}

