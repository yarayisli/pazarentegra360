import { Router, type Response } from "express";
import rateLimit from "express-rate-limit";
import type { AnyDb } from "../db/seed";
import { tenantIdOf } from "../middleware/auth";
import { verifyCredentials } from "../integrations/trendyol/credentials";
import { EncryptionKeyError } from "../services/crypto";
import {
  createAccount,
  deleteAccount,
  isMarketplace,
  listAccounts,
  sanitizeConfig,
  testAccount,
  updateAccount,
} from "../services/marketplaceAccounts";

const fail = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ success: false, error: { code, message } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const notFound = (res: Response) => fail(res, 404, "NOT_FOUND", "Hesap bulunamadı.");

export function createMarketplaceAccountsRouter(db: AnyDb) {
  const router = Router();
  const base = "/api/marketplace-accounts";

  // Account endpoints touch encrypted secrets; keep them from being hammered.
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
      res.json({ success: true, accounts: await listAccounts(db, tenantIdOf(req)) });
    } catch (err) {
      next(err);
    }
  });

  router.post(base, async (req, res, next) => {
    try {
      const { marketplace, config } = req.body ?? {};
      if (!isMarketplace(marketplace)) return fail(res, 400, "INVALID_MARKETPLACE", "Geçersiz pazaryeri.");
      const account = await createAccount(db, tenantIdOf(req), marketplace, sanitizeConfig(marketplace, config));
      res.status(201).json({ success: true, account });
    } catch (err) {
      next(err);
    }
  });

  router.put(`${base}/:id`, async (req, res, next) => {
    try {
      if (!UUID.test(req.params.id)) return notFound(res);
      const account = await updateAccount(db, tenantIdOf(req), req.params.id, req.body?.config);
      if (!account) return notFound(res);
      res.json({ success: true, account });
    } catch (err) {
      next(err);
    }
  });

  router.delete(`${base}/:id`, async (req, res, next) => {
    try {
      if (!UUID.test(req.params.id) || !(await deleteAccount(db, tenantIdOf(req), req.params.id))) return notFound(res);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.post(`${base}/:id/test`, async (req, res, next) => {
    try {
      if (!UUID.test(req.params.id)) return notFound(res);
      const result = await testAccount(db, tenantIdOf(req), req.params.id);
      if (!result) return notFound(res);
      if (result.missing.length > 0) {
        return fail(res, 400, "MISSING_FIELDS", `Eksik alanlar: ${result.missing.join(", ")}`);
      }
      const message =
        result.marketplace === "trendyol"
          ? verifyCredentials(String(result.config.supplierId)).message
          : "Kimlik bilgileri kaydedildi.";
      res.json({ success: true, status: result.status, message });
    } catch (err) {
      next(err);
    }
  });

  // Missing/invalid encryption key is a deployment problem, not a client error.
  router.use((err: unknown, _req: unknown, res: Response, next: (e?: unknown) => void) => {
    if (err instanceof EncryptionKeyError) {
      return fail(res, 503, "CONFIG_MISSING", "Kimlik bilgisi şifreleme anahtarı yapılandırılmamış.");
    }
    next(err);
  });

  return router;
}
