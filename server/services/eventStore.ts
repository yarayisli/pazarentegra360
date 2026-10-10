// In-memory Event Store & Webhook Logs (for demonstration & live testability).
// Replaced by database tables in a later phase.

export interface OrderEvent {
  id: string;
  orderId: number;
  orderNumber: string;
  marketplace: string;
  fromStatus: string;
  toStatus: string;
  eventSource: string;
  idempotencyKey: string;
  description: string;
  operatorName: string;
  payloadSnapshot: unknown;
  createdAt: number;
}

export interface WebhookLog {
  id: string;
  marketplace: string;
  eventType: string;
  idempotencyKey: string;
  status: string;
  receivedAt: number;
  processingTimeMs: number;
  orderNumber: string;
  payload: unknown;
}

export interface EventStore {
  orderEventStore: OrderEvent[];
  processedWebhookKeys: Set<string>;
  webhookLogs: WebhookLog[];
}

// Creates a fresh store with the demo seed data, so each app instance gets isolated state.
export function createEventStore(): EventStore {
  const orderEventStore: OrderEvent[] = [
    {
      id: "evt-101",
      orderId: 914028471,
      orderNumber: "9482019481",
      marketplace: "trendyol",
      fromStatus: "None",
      toStatus: "Created",
      eventSource: "WEBHOOK",
      idempotencyKey: "ty-pkg-created-914028471-v1",
      description: "Trendyol SAPIGW Webhook: shipment-package.created tetiklendi.",
      operatorName: "Trendyol Webhook",
      payloadSnapshot: { packageId: 914028471, status: "Created", totalGross: 1850.0 },
      createdAt: Date.now() - 7200000,
    },
    {
      id: "evt-102",
      orderId: 914028472,
      orderNumber: "HB-74920194",
      marketplace: "hepsiburada",
      fromStatus: "Created",
      toStatus: "Picking",
      eventSource: "USER_SCAN",
      idempotencyKey: "hb-scan-pick-914028472",
      description: "Depo personeli (Ahmet K.) raf barkodunu okuttu ve toplamaya başladı.",
      operatorName: "Ahmet K. (Depo Operatörü)",
      payloadSnapshot: { warehouseId: "DEP-01", shelfLocation: "A-04-02" },
      createdAt: Date.now() - 3600000,
    },
  ];

  const processedWebhookKeys = new Set<string>(["ty-pkg-created-914028471-v1", "hb-scan-pick-914028472"]);

  const webhookLogs: WebhookLog[] = [
    {
      id: "wh-log-1",
      marketplace: "trendyol",
      eventType: "shipment-package.created",
      idempotencyKey: "ty-pkg-created-914028471-v1",
      status: "SUCCESS",
      receivedAt: Date.now() - 7200000,
      processingTimeMs: 42,
      orderNumber: "9482019481",
      payload: { packageId: 914028471, status: "Created", customer: "Burak Yılmaz" },
    },
  ];

  return { orderEventStore, processedWebhookKeys, webhookLogs };
}

// One isolated store per tenant (created lazily). Replaced by tenant-filtered DB queries in #10.
export interface TenantStores {
  forTenant(tenantId: string): EventStore;
}

export function createTenantStores(): TenantStores {
  const stores = new Map<string, EventStore>();
  return {
    forTenant(tenantId) {
      let store = stores.get(tenantId);
      if (!store) {
        store = createEventStore();
        stores.set(tenantId, store);
      }
      return store;
    },
  };
}
