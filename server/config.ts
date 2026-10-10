import { z } from "zod";

// Central place for runtime configuration. Values are read lazily so tests can change process.env.
export const DEFAULT_PORT = 3000;

export function getPort(): number {
  return DEFAULT_PORT;
}

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || undefined;
}

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const encryptionKey = z.string().refine(
  (raw) => {
    const v = raw.trim();
    const key = /^[0-9a-fA-F]{64}$/.test(v) ? Buffer.from(v, "hex") : Buffer.from(v, "base64");
    return key.length === 32;
  },
  { message: "must be 32 bytes (base64 or 64 hex chars)" },
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.preprocess(
    emptyToUndefined,
    z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
  ),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().optional()),
  GEMINI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  CREDENTIALS_ENCRYPTION_KEY: z.preprocess(emptyToUndefined, encryptionKey.optional()),
});

export type AppConfig = z.infer<typeof envSchema>;

export class ConfigError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid configuration:\n${issues.map((i) => `  - ${i}`).join("\n")}`);
    this.name = "ConfigError";
  }
}

// Validates the environment once at startup; throws a readable ConfigError instead of failing later.
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  const issues = parsed.success ? [] : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  const nodeEnv = parsed.success ? parsed.data.NODE_ENV : env.NODE_ENV;
  if (nodeEnv === "production" && !env.CREDENTIALS_ENCRYPTION_KEY?.trim()) {
    issues.push("CREDENTIALS_ENCRYPTION_KEY: required in production");
  }
  if (!parsed.success || issues.length > 0) throw new ConfigError(issues);
  return parsed.data;
}
