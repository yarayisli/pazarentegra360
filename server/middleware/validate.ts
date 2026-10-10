import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { errorBody } from "./errorHandler";

// Validates req.body against a zod schema and replaces it with the parsed value
// (unknown keys are dropped by default). Failure → 400 VALIDATION_ERROR.
export function validate(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const detail = result.error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ` : "") + i.message);
      return res.status(400).json(errorBody("VALIDATION_ERROR", `Geçersiz istek: ${detail.join("; ")}`));
    }
    req.body = result.data;
    next();
  };
}
