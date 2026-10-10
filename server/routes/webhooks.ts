import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { tenantIdOf } from "../middleware/auth";
import type { AnyDb } from "../db/seed";
import { listWebhookLogs, recordWebhook } from "../services/eventStore";

const text = z.string().trim().min(1).max(200);
const simulateBody = z.object({
  marketplace: text,
  eventType: text,
  orderNumber: text,
  newStatus: text,
  orderId: z.number().optional(),
  fromStatus: text.optional(),
  idempotencyKey: text.optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export function createWebhooksRouter(db: AnyDb) {
  const router = Router();

  // Webhook ingestion with idempotency & deduplication (unique key in order_events).
  router.post("/api/webhooks/simulate", validate(simulateBody), async (req, res, next) => {
    try {
      const result = await recordWebhook(db, tenantIdOf(req), req.body);
      if (!("event" in result)) {
        return res.status(200).json({
          success: true,
          deduplicated: true,
          message: `[IDEMPOTENCY] Bu webhook (${result.idempotencyKey}) daha önce işlendi. Mükerrer durum engellendi.`,
          log: result.log,
        });
      }
      res.json({
        success: true,
        deduplicated: false,
        message: `Webhook başarıyla Event Store'a yazıldı ve işlendi.`,
        event: result.event,
        log: result.log,
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/api/webhooks/logs", async (req, res, next) => {
    try {
      res.json({ success: true, logs: await listWebhookLogs(db, tenantIdOf(req)) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
