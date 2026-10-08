import { Router } from "express";
import type { EventStore } from "../services/eventStore";
import { runReconciliation } from "../services/reconciliation";

export function createOrdersRouter(store: EventStore) {
  const { orderEventStore } = store;
  const router = Router();

  // Get Event Store for orders
  router.get("/api/orders/events", (req, res) => {
    const orderId = req.query.orderId ? Number(req.query.orderId) : null;
    if (orderId) {
      const filtered = orderEventStore.filter(e => e.orderId === orderId);
      return res.json({ success: true, events: filtered });
    }
    // Return all recent events sorted by date desc
    res.json({ success: true, events: [...orderEventStore].sort((a, b) => b.createdAt - a.createdAt) });
  });

  // Reconciliation Engine: Delta Sync
  router.post("/api/orders/reconcile", (_req, res) => {
    res.json({ success: true, ...runReconciliation() });
  });

  return router;
}
