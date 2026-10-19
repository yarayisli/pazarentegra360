import { Router, type Response } from "express";
import type { AnyDb } from "../db/seed";
import { tenantIdOf } from "../middleware/auth";
import { listAuditLogs } from "../services/audit";

const fail = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ success: false, error: { code, message } });

const positiveInt = (v: unknown, fallback: number) => {
  if (v === undefined) return fallback;
  const n = typeof v === "string" && /^\d+$/.test(v) ? Number(v) : NaN;
  return Number.isSafeInteger(n) && n >= 1 ? n : NaN;
};

const toDate = (v: unknown) => {
  if (v === undefined) return undefined;
  const d = typeof v === "string" ? new Date(v) : new Date(NaN);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function createAuditRouter(db: AnyDb) {
  const router = Router();

  router.get("/api/audit-logs", async (req, res, next) => {
    try {
      const page = positiveInt(req.query.page, 1);
      const pageSize = positiveInt(req.query.pageSize, 25);
      const from = toDate(req.query.from);
      const to = toDate(req.query.to);
      const rawAction = req.query.action;
      if (Number.isNaN(page) || Number.isNaN(pageSize) || pageSize > 100)
        return fail(res, 400, "INVALID_PAGINATION", "Geçersiz sayfalama değeri.");
      if (from === null || to === null) return fail(res, 400, "INVALID_DATE", "Geçersiz tarih.");
      if (rawAction !== undefined && typeof rawAction !== "string")
        return fail(res, 400, "INVALID_ACTION", "Geçersiz eylem.");
      const action = typeof rawAction === "string" ? rawAction : undefined;
      res.json({
        success: true,
        ...(await listAuditLogs(db, tenantIdOf(req), { page, pageSize, action, from, to })),
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
