import { Router } from "express";
import { createRateLimiter } from "../middleware/rateLimit";
import { verifyCredentials } from "../integrations/trendyol/credentials";

export function createIntegrationsRouter() {
  const router = Router();
  // Credential checks hit the marketplace; keep them from being hammered.
  const credentialsLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

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
