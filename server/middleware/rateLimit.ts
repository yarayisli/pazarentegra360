import type { RequestHandler } from "express";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

// Minimal fixed-window, in-memory rate limiter keyed by client IP.
// Each call creates its own counters, so every app instance (and test) gets isolated state.
export function createRateLimiter({ windowMs, max }: RateLimitOptions): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || "unknown";
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ success: false, message: "Çok fazla istek. Lütfen biraz sonra tekrar deneyin." });
    }

    // Opportunistic cleanup so the map cannot grow without bound.
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    next();
  };
}
