import { Router, type Response } from "express";
import rateLimit from "express-rate-limit";
import type { AnyDb } from "../db/seed";
import { tenantIdOf } from "../middleware/auth";
import {
  approveAction,
  listPendingActions,
  rejectAction,
  unavailableAdapterResolver,
  type AdapterResolver,
  type DecisionResult,
} from "../services/pendingActions";

const fail = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ success: false, error: { code, message } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ["PENDING", "APPROVED", "REJECTED", "EXPIRED", "EXECUTED", "FAILED"];

function respond(res: Response, result: DecisionResult) {
  if (!("reason" in result)) return res.json({ success: true, action: result.action });
  if (result.reason === "NOT_FOUND") return fail(res, 404, "NOT_FOUND", "İşlem bulunamadı.");
  return fail(res, 409, "NOT_PENDING", "İşlem artık beklemiyor (karar verilmiş veya süresi dolmuş).");
}

export function createPendingActionsRouter(db: AnyDb, resolve: AdapterResolver = unavailableAdapterResolver) {
  const router = Router();
  const base = "/api/pending-actions";

  router.use(
    base,
    rateLimit({
      windowMs: 60_000,
      limit: 60,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => fail(res, 429, "RATE_LIMITED", "Çok fazla istek. Lütfen biraz sonra tekrar deneyin."),
    }),
  );

  router.get(base, async (req, res, next) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      if (status !== undefined && !STATUSES.includes(status))
        return fail(res, 400, "INVALID_STATUS", "Geçersiz durum.");
      res.json({ success: true, actions: await listPendingActions(db, tenantIdOf(req), status) });
    } catch (err) {
      next(err);
    }
  });

  router.post(`${base}/:id/approve`, async (req, res, next) => {
    try {
      if (!UUID.test(req.params.id)) return fail(res, 404, "NOT_FOUND", "İşlem bulunamadı.");
      respond(res, await approveAction(db, tenantIdOf(req), req.params.id, req.auth!.userId, resolve));
    } catch (err) {
      next(err);
    }
  });

  router.post(`${base}/:id/reject`, async (req, res, next) => {
    try {
      if (!UUID.test(req.params.id)) return fail(res, 404, "NOT_FOUND", "İşlem bulunamadı.");
      respond(res, await rejectAction(db, tenantIdOf(req), req.params.id, req.auth!.userId));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
