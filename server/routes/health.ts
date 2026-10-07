import { Router } from "express";

export function createHealthRouter() {
  const router = Router();

  router.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  return router;
}
