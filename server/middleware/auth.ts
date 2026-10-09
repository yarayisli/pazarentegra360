import type { NextFunction, Request, Response } from "express";
import type { AnyDb } from "../db/seed";
import { findSession, readSessionToken, type AuthContext } from "../services/auth";

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

export function unauthorized(res: Response) {
  return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Oturum açmanız gerekiyor." } });
}

// Everything mounted after this middleware requires a valid session. The tenant comes
// from the session only, never from the request body or query.
export function createRequireAuth(db: AnyDb) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = readSessionToken(req.headers.cookie);
      const auth = token ? await findSession(db, token) : null;
      if (!auth) return unauthorized(res);
      req.auth = auth;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Only valid behind requireAuth.
export function tenantIdOf(req: Request): string {
  if (!req.auth) throw new Error("requireAuth must run before tenant-scoped handlers");
  return req.auth.tenantId;
}
