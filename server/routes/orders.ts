import { Router } from "express";
import type { AnyDb } from "../db/seed";
import { tenantIdOf } from "../middleware/auth";
import { listEvents } from "../services/eventStore";
import { runReconciliation } from "../services/reconciliation";

export function createOrdersRouter(db: AnyDb) {
  const router = Router();

  // Event Store for orders, newest first
  router.get("/api/orders/events", async (req, res, next) => {
    try {
      const orderId = req.query.orderId ? Number(req.query.orderId) : undefined;
      const events = await listEvents(db, tenantIdOf(req), Number.isSafeInteger(orderId) ? orderId : undefined);
      res.json({ success: true, events });
    } catch (err) {
      next(err);
    }
  });

  // Reconciliation Engine: Delta Sync
  router.post("/api/orders/reconcile", (_req, res) => {
    res.json({ success: true, ...runReconciliation() });
  });

  return router;
}
