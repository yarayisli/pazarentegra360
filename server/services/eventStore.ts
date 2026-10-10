import { and, desc, eq } from "drizzle-orm";
import type { AnyDb } from "../db/seed";
import { orderEvents, webhookLogs } from "../db/schema";

// Event Store and webhook logs live in Postgres (#10). `order_events` is append-only:
// this module only inserts and selects, and must never gain an update/delete path.

export interface OrderEvent {
  id: string;
  orderId: number | null;
  orderNumber: string;
  marketplace: string;
  fromStatus: string;
  toStatus: string;
  eventSource: string;
  idempotencyKey: string;
  description: string;
  operatorName: string | null;
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
  orderNumber: string | null;
  payload: unknown;
}

export interface WebhookInput {
  marketplace: string;
  eventType: string;
  orderNumber: string;
  newStatus: string;
  orderId?: number;
  fromStatus?: string;
  idempotencyKey?: string;
  payload?: Record<string, unknown>;
}

export type WebhookResult =
  | { deduplicated: false; event: OrderEvent; log: WebhookLog }
  | { deduplicated: true; idempotencyKey: string; log: WebhookLog };

const toEvent = (r: typeof orderEvents.$inferSelect): OrderEvent => ({
  id: r.id,
  orderId: r.orderExternalId,
  orderNumber: r.orderNumber,
  marketplace: r.marketplace,
  fromStatus: r.fromStatus,
  toStatus: r.toStatus,
  eventSource: r.eventSource,
  idempotencyKey: r.idempotencyKey,
  description: r.description,
  operatorName: r.operatorName,
  payloadSnapshot: r.payloadSnapshot,
  createdAt: r.createdAt.getTime(),
});

const toLog = (r: typeof webhookLogs.$inferSelect): WebhookLog => ({
  id: r.id,
  marketplace: r.marketplace,
  eventType: r.eventType,
  idempotencyKey: r.idempotencyKey,
  status: r.status,
  receivedAt: r.receivedAt.getTime(),
  processingTimeMs: r.processingTimeMs,
  orderNumber: r.orderNumber,
  payload: r.payload,
});

// Idempotent ingestion. The unique (tenant_id, idempotency_key) index decides the winner,
// so concurrent identical webhooks produce exactly one event.
export async function recordWebhook(db: AnyDb, tenantId: string, input: WebhookInput): Promise<WebhookResult> {
  const startTime = Date.now();
  const { marketplace, eventType, orderNumber, newStatus, payload } = input;
  const idempotencyKey =
    input.idempotencyKey || `${marketplace}-${orderNumber}-${newStatus}-${Math.floor(Date.now() / 60000)}`;

  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(orderEvents)
      .values({
        tenantId,
        orderExternalId: input.orderId ?? null,
        orderNumber,
        marketplace,
        fromStatus: input.fromStatus || "Picking",
        toStatus: newStatus,
        eventSource: "WEBHOOK",
        idempotencyKey,
        description: `${marketplace.toUpperCase()} Webhook (${eventType}): Sipariş durumu '${newStatus}' olarak güncellendi.`,
        operatorName: `${marketplace.toUpperCase()} System Webhook`,
        payloadSnapshot: payload ?? {},
      })
      .onConflictDoNothing({ target: [orderEvents.tenantId, orderEvents.idempotencyKey] })
      .returning();

    const [log] = await tx
      .insert(webhookLogs)
      .values({
        tenantId,
        marketplace,
        eventType,
        idempotencyKey,
        status: inserted ? "SUCCESS" : "DUPLICATE_IGNORED",
        processingTimeMs: Date.now() - startTime,
        orderNumber,
        payload: payload ?? (inserted ? {} : { duplicate: true }),
      })
      .returning();

    return inserted
      ? { deduplicated: false as const, event: toEvent(inserted), log: toLog(log) }
      : { deduplicated: true as const, idempotencyKey, log: toLog(log) };
  });
}

// Newest first; optionally limited to one marketplace package id.
export async function listEvents(db: AnyDb, tenantId: string, orderId?: number): Promise<OrderEvent[]> {
  const where = orderId
    ? and(eq(orderEvents.tenantId, tenantId), eq(orderEvents.orderExternalId, orderId))
    : eq(orderEvents.tenantId, tenantId);
  const rows = await db.select().from(orderEvents).where(where).orderBy(desc(orderEvents.createdAt));
  return rows.map(toEvent);
}

export async function listWebhookLogs(db: AnyDb, tenantId: string, limit = 50): Promise<WebhookLog[]> {
  const rows = await db
    .select()
    .from(webhookLogs)
    .where(eq(webhookLogs.tenantId, tenantId))
    .orderBy(desc(webhookLogs.receivedAt))
    .limit(limit);
  return rows.map(toLog);
}
