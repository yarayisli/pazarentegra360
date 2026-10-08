import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import type { AnyDb } from "../db/seed";
import { createRequireAuth } from "../middleware/auth";
import {
  authenticate,
  createSession,
  deleteSession,
  EmailTakenError,
  isValidEmail,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
  readSessionToken,
  registerUser,
  SESSION_COOKIE,
  SESSION_TTL_MS,
} from "../services/auth";

const fail = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ success: false, error: { code, message } });

const limiter = (windowMs: number, limit: number, skipSuccessfulRequests = false) =>
  rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      fail(res, 429, "RATE_LIMITED", "Çok fazla deneme. Lütfen biraz sonra tekrar deneyin."),
  });

function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export function createAuthRouter(db: AnyDb) {
  const router = Router();

  async function startSession(res: Response, auth: { userId: string; tenantId: string; email: string }) {
    const { token } = await createSession(db, auth.userId, auth.tenantId);
    setSessionCookie(res, token);
    res.json({ success: true, user: { email: auth.email } });
  }

  router.post("/api/auth/register", limiter(60 * 60_000, 20), async (req: Request, res: Response) => {
    const email = normalizeEmail(str(req.body?.email));
    const password = str(req.body?.password);
    const tenantName = str(req.body?.tenantName).trim() || email;
    if (!isValidEmail(email)) return fail(res, 400, "INVALID_EMAIL", "Geçerli bir e-posta adresi girin.");
    if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      return fail(res, 400, "INVALID_PASSWORD", `Parola ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} karakter olmalıdır.`);
    }
    if (tenantName.length > 100) return fail(res, 400, "INVALID_TENANT_NAME", "Mağaza adı en fazla 100 karakter olabilir.");
    try {
      const auth = await registerUser(db, { email, password, tenantName });
      res.status(201);
      await startSession(res, auth);
    } catch (err) {
      if (err instanceof EmailTakenError) return fail(res, 409, "EMAIL_TAKEN", "Bu e-posta adresi zaten kayıtlı.");
      console.error("Register error:", err);
      fail(res, 500, "INTERNAL_ERROR", "Kayıt sırasında bir hata oluştu.");
    }
  });

  // Only failed attempts count toward the limit.
  router.post("/api/auth/login", limiter(15 * 60_000, 10, true), async (req: Request, res: Response) => {
    const email = normalizeEmail(str(req.body?.email));
    const password = str(req.body?.password);
    if (!email || !password || password.length > MAX_PASSWORD_LENGTH) {
      return fail(res, 401, "INVALID_CREDENTIALS", "E-posta veya parola hatalı.");
    }
    try {
      const auth = await authenticate(db, email, password);
      if (!auth) return fail(res, 401, "INVALID_CREDENTIALS", "E-posta veya parola hatalı.");
      await startSession(res, auth);
    } catch (err) {
      console.error("Login error:", err);
      fail(res, 500, "INTERNAL_ERROR", "Giriş sırasında bir hata oluştu.");
    }
  });

  router.post("/api/auth/logout", async (req: Request, res: Response) => {
    const token = readSessionToken(req.headers.cookie);
    try {
      if (token) await deleteSession(db, token);
    } catch (err) {
      console.error("Logout error:", err);
    }
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.json({ success: true });
  });

  router.get("/api/auth/me", createRequireAuth(db), (req: Request, res: Response) => {
    res.json({ success: true, user: { email: req.auth!.email } });
  });

  return router;
}
