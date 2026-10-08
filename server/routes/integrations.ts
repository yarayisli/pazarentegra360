import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verifyCredentials } from "../integrations/trendyol/credentials";

export function createIntegrationsRouter() {
  const router = Router();
  // Credential checks hit the marketplace; keep them from being hammered.
  const credentialsLimiter = rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ success: false, message: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." });
    },
  });

  // Simulates Trendyol API check / verify credentials
  router.post("/api/trendyol/verify-credentials", credentialsLimiter, (req, res) => {
    const { supplierId, apiKey, apiSecret } = req.body;
    if (!supplierId || !apiKey || !apiSecret) {
      return res.status(400).json({ success: false, message: "Satıcı ID, API Key ve API Secret zorunludur." });
    }

    return res.json({ success: true, ...verifyCredentials(supplierId) });
  });

  return router;
}
