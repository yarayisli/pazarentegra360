import type { ErrorRequestHandler, RequestHandler } from "express";
import { logger } from "../logger";

export const errorBody = (code: string, message: string) => ({ success: false, error: { code, message } });

export const apiNotFound: RequestHandler = (_req, res) => {
  res.status(404).json(errorBody("NOT_FOUND", "Kaynak bulunamadı."));
};

// Last middleware: every error leaves as { success:false, error:{ code, message } }.
// Internal details go to the log only, never to the response.
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const type = (err as { type?: string } | null)?.type;
  if (type === "entity.parse.failed") {
    return res.status(400).json(errorBody("INVALID_JSON", "İstek gövdesi geçerli JSON değil."));
  }
  if (type === "entity.too.large") {
    return res.status(413).json(errorBody("PAYLOAD_TOO_LARGE", "İstek gövdesi çok büyük."));
  }
  (req.log ?? logger).error({ err }, "unhandled error");
  res.status(500).json(errorBody("INTERNAL_ERROR", "Beklenmeyen bir hata oluştu."));
};
