import { Router } from "express";
import { verifyCredentials } from "../integrations/trendyol/credentials";

export function createIntegrationsRouter() {
  const router = Router();

  // Simulates Trendyol API check / verify credentials
  router.post("/api/trendyol/verify-credentials", (req, res) => {
    const { supplierId, apiKey, apiSecret } = req.body;
    if (!supplierId || !apiKey || !apiSecret) {
      return res.status(400).json({ success: false, message: "Satıcı ID, API Key ve API Secret zorunludur." });
    }

    return res.json({ success: true, ...verifyCredentials(supplierId) });
  });

  return router;
}
