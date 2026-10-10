import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { Logger } from "pino";
import { logger as rootLogger } from "../logger";

declare module "express-serve-static-core" {
  interface Request {
    id?: string;
    log?: Logger;
  }
}

const SAFE_ID = /^[A-Za-z0-9._-]{8,64}$/;

// Assigns a requestId (echoed in X-Request-Id), a child logger, and writes one access log per request.
export function requestContext(logger: Logger = rootLogger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.headers["x-request-id"];
    const id = typeof incoming === "string" && SAFE_ID.test(incoming) ? incoming : randomUUID();
    req.id = id;
    req.log = logger.child({ requestId: id });
    res.setHeader("X-Request-Id", id);
    const started = Date.now();
    res.on("finish", () => {
      req.log?.info(
        { method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - started },
        "request completed",
      );
    });
    next();
  };
}
