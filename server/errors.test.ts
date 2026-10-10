import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { ConfigError, loadConfig } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { requestContext } from "./middleware/requestContext";
import { createTestApp } from "./testApp";

describe("loadConfig", () => {
  it("accepts a minimal development environment", () => {
    expect(loadConfig({ NODE_ENV: "development" }).NODE_ENV).toBe("development");
    expect(loadConfig({}).NODE_ENV).toBe("development");
  });

  it("requires CREDENTIALS_ENCRYPTION_KEY in production with a readable error", () => {
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow(ConfigError);
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow(/CREDENTIALS_ENCRYPTION_KEY: required in production/);
  });

  it("accepts a valid production key and rejects a malformed one", () => {
    const key = "a".repeat(64);
    expect(loadConfig({ NODE_ENV: "production", CREDENTIALS_ENCRYPTION_KEY: key }).CREDENTIALS_ENCRYPTION_KEY).toBe(
      key,
    );
    expect(() => loadConfig({ CREDENTIALS_ENCRYPTION_KEY: "short" })).toThrow(/32 bytes/);
  });

  it("rejects an invalid LOG_LEVEL and treats empty values as unset", () => {
    expect(() => loadConfig({ LOG_LEVEL: "loud" })).toThrow(ConfigError);
    expect(loadConfig({ LOG_LEVEL: "", DATABASE_URL: "" }).LOG_LEVEL).toBeUndefined();
  });
});

describe("central error handling", () => {
  it("returns 400 with the standard format for an invalid body", async () => {
    const t = await createTestApp();
    const agent = await t.signUp();
    const res = await agent.post("/api/webhooks/simulate").send({ marketplace: "trendyol" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toContain("orderNumber");
    await t.close();
  });

  it("returns 400 INVALID_JSON for malformed JSON", async () => {
    const t = await createTestApp();
    const res = await request(t.app).post("/api/auth/login").set("Content-Type", "application/json").send("{bad");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
    await t.close();
  });

  it("returns 404 in the standard format for unknown API routes", async () => {
    const t = await createTestApp();
    const agent = await t.signUp();
    const res = await agent.get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: { code: "NOT_FOUND", message: "Kaynak bulunamadı." } });
    await t.close();
  });

  it("turns an unhandled error into a 500 without leaking details", async () => {
    const app = express();
    app.use(requestContext());
    app.get("/boom", () => {
      throw new Error("secret database password leaked");
    });
    app.use(errorHandler);
    const res = await request(app).get("/boom");
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(res.body)).not.toContain("secret");
    expect(JSON.stringify(res.body)).not.toContain("at ");
  });
});

describe("requestContext", () => {
  it("echoes a safe incoming X-Request-Id and generates one otherwise", async () => {
    const t = await createTestApp();
    const kept = await request(t.app).get("/api/health").set("X-Request-Id", "req-12345678");
    expect(kept.headers["x-request-id"]).toBe("req-12345678");
    const replaced = await request(t.app).get("/api/health").set("X-Request-Id", "bad id!");
    expect(replaced.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
    await t.close();
  });
});
