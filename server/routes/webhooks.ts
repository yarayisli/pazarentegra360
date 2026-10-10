import { Router } from "express";
import { tenantIdOf } from "../middleware/auth";
import type { OrderEvent, TenantStores, WebhookLog } from "../services/eventStore";

export function createWebhooksRouter(stores: TenantStores) {
  const router = Router();

  // Webhook Ingestion with Idempotency & Deduplication
  router.post("/api/webhooks/simulate", (req, res) => {
    const { orderEventStore, processedWebhookKeys, webhookLogs } = stores.forTenant(tenantIdOf(req));
    const startTime = Date.now();
    const { marketplace, eventType, orderId, orderNumber, newStatus, payload } = req.body;

    if (!marketplace || !eventType || !orderNumber || !newStatus) {
      return res.status(400).json({ success: false, message: "Eksik webhook parametresi." });
    }

    // Generate or read idempotency key
    const idempotencyKey =
      req.body.idempotencyKey || `${marketplace}-${orderNumber}-${newStatus}-${Math.floor(Date.now() / 60000)}`;

    // Deduplication check (Redis simulation)
    if (processedWebhookKeys.has(idempotencyKey)) {
      const duplicateLog: WebhookLog = {
        id: `wh-log-${Date.now()}`,
        marketplace,
        eventType,
        idempotencyKey,
        status: "DUPLICATE_IGNORED",
        receivedAt: Date.now(),
        processingTimeMs: Date.now() - startTime,
        orderNumber,
        payload: payload || { duplicate: true },
      };
      webhookLogs.unshift(duplicateLog);
      return res.status(200).json({
        success: true,
        deduplicated: true,
        message: `[IDEMPOTENCY] Bu webhook (${idempotencyKey}) daha önce işlendi. Mükerrer durum engellendi.`,
        log: duplicateLog,
      });
    }

    // Register idempotency key
    processedWebhookKeys.add(idempotencyKey);

    // Append to Event Store (silinemez append-only log)
    const event: OrderEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderId: orderId || Math.floor(Math.random() * 900000000) + 100000000,
      orderNumber,
      marketplace,
      fromStatus: req.body.fromStatus || "Picking",
      toStatus: newStatus,
      eventSource: "WEBHOOK",
      idempotencyKey,
      description: `${marketplace.toUpperCase()} Webhook (${eventType}): Sipariş durumu '${newStatus}' olarak güncellendi.`,
      operatorName: `${marketplace.toUpperCase()} System Webhook`,
      payloadSnapshot: payload || {},
      createdAt: Date.now(),
    };

    orderEventStore.unshift(event);

    const successLog: WebhookLog = {
      id: `wh-log-${Date.now()}`,
      marketplace,
      eventType,
      idempotencyKey,
      status: "SUCCESS",
      receivedAt: Date.now(),
      processingTimeMs: Date.now() - startTime,
      orderNumber,
      payload: payload || {},
    };
    webhookLogs.unshift(successLog);

    res.json({
      success: true,
      deduplicated: false,
      message: `Webhook başarıyla Event Store'a yazıldı ve işlendi.`,
      event,
      log: successLog,
    });
  });

  // Get Webhook Logs
  router.get("/api/webhooks/logs", (req, res) => {
    const { webhookLogs } = stores.forTenant(tenantIdOf(req));
    res.json({ success: true, logs: webhookLogs.slice(0, 50) });
  });

  return router;
}
