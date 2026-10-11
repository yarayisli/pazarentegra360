import { Router, type Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import type { AnyDb } from "../db/seed";
import { tenantIdOf } from "../middleware/auth";
import { errorBody } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import {
  AI_NOT_CONFIGURED_TEXT,
  COPILOT_SYSTEM_INSTRUCTION,
  MAX_CONTEXT_LENGTH,
  MAX_PROMPT_LENGTH,
  REPLY_SYSTEM_INSTRUCTION,
  buildCopilotContents,
  buildReplyContents,
  buildTenantContext,
  generateText,
  getGeminiClient,
  type AiClient,
} from "../services/ai";

const shortText = (max: number) => z.string().trim().max(max).optional();

const copilotSchema = z.object({
  prompt: z.string().trim().min(1).max(MAX_PROMPT_LENGTH),
  context: z
    .unknown()
    .optional()
    .refine((v) => v === undefined || JSON.stringify(v).length <= MAX_CONTEXT_LENGTH, {
      message: `context en fazla ${MAX_CONTEXT_LENGTH} karakter olabilir`,
    }),
});

const replySchema = z.object({
  question: z.string().trim().min(1).max(MAX_PROMPT_LENGTH),
  productName: shortText(300),
  customerName: shortText(200),
  marketplace: shortText(50),
  orderContext: shortText(500),
});

export interface AiRouterOptions {
  getClient?: () => AiClient | null;
  rateLimitPerMinute?: number;
}

const unavailable = (res: Response) =>
  res.status(502).json(errorBody("AI_UNAVAILABLE", "AI servisi şu an yanıt veremiyor. Lütfen tekrar deneyin."));

export function createAiRouter(
  db: AnyDb,
  { getClient = getGeminiClient, rateLimitPerMinute = 20 }: AiRouterOptions = {},
) {
  const router = Router();

  // Gemini calls cost money: limit per tenant (mounted behind requireAuth, so the tenant is known).
  router.use(
    "/api/ai",
    rateLimit({
      windowMs: 60_000,
      limit: rateLimitPerMinute,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => tenantIdOf(req),
      handler: (_req, res) =>
        res.status(429).json(errorBody("RATE_LIMITED", "Çok fazla AI isteği. Lütfen biraz sonra tekrar deneyin.")),
    }),
  );

  // AI Copilot: answers from real tenant data; the client context is passed as untrusted data.
  router.post("/api/ai/copilot", validate(copilotSchema), async (req, res, next) => {
    try {
      const ai = getClient();
      if (!ai) return res.json({ success: true, text: AI_NOT_CONFIGURED_TEXT, source: "unconfigured" });

      const { prompt, context } = req.body as z.infer<typeof copilotSchema>;
      const tenantContext = await buildTenantContext(db, tenantIdOf(req));
      try {
        const text = await generateText(
          ai,
          COPILOT_SYSTEM_INSTRUCTION,
          buildCopilotContents(prompt, tenantContext, context),
        );
        if (!text) return unavailable(res);
        res.json({ success: true, text, source: "gemini" });
      } catch (err) {
        req.log?.error({ err }, "AI copilot failed");
        unavailable(res);
      }
    } catch (err) {
      next(err);
    }
  });

  // Customer question reply draft. Never sent automatically; the user approves it in the UI.
  router.post("/api/ai/suggest-reply", validate(replySchema), async (req, res) => {
    const ai = getClient();
    if (!ai) {
      return res.status(503).json(errorBody("AI_NOT_CONFIGURED", AI_NOT_CONFIGURED_TEXT));
    }
    try {
      const answer = await generateText(
        ai,
        REPLY_SYSTEM_INSTRUCTION,
        buildReplyContents(req.body as z.infer<typeof replySchema>),
      );
      if (!answer) return unavailable(res);
      res.json({ success: true, answer, source: "gemini" });
    } catch (err) {
      req.log?.error({ err }, "AI reply failed");
      unavailable(res);
    }
  });

  return router;
}
