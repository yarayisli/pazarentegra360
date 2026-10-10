import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { verifyCredentials } from "../integrations/trendyol/credentials";

const credentialsBody = z.object({
  supplierId: z.union([z.string().trim().min(1), z.number()]),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
});

export function createIntegrationsRouter() {
  const router = Router();
  // Credential checks hit the marketplace; keep them from being hammered.
  const credentialsLimiter = rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: { code: "RATE_LIMITED", message: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." },
      });
    },
  });

  // Simulates Trendyol API check / verify credentials
  router.post("/api/trendyol/verify-credentials", credentialsLimiter, validate(credentialsBody), (req, res) => {
    return res.json({ success: true, ...verifyCredentials(String(req.body.supplierId)) });
  });

  return router;
}
