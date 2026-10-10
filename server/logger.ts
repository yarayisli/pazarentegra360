import pino from "pino";

// Structured JSON logs. Silent under test so output stays readable; override with LOG_LEVEL.
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "test" || process.env.VITEST ? "silent" : "info"),
  redact: ["req.headers.cookie", "req.headers.authorization"],
});
