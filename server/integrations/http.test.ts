import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import {
  MarketplaceHttpError,
  MarketplaceTimeoutError,
  RateLimiter,
  createHttpClient,
  maskHeaders,
  type HttpLogger,
} from "./http";
import { errorHandler } from "../middleware/errorHandler";

const json = (status: number, body: unknown = {}, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers });

const noSleep = (_ms: number) => Promise.resolve();

afterEach(() => vi.useRealTimers());

describe("createHttpClient", () => {
  it("sends base url, default headers, query and generated Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { ok: 1 }));
    const client = createHttpClient({
      baseUrl: "https://api.example.test/v1",
      headers: { "User-Agent": "1 - SelfIntegration" },
      authorization: () => "Basic abc",
      fetch: fetchMock,
    });
    await expect(client.get("/orders", { query: { page: 2, skip: undefined } })).resolves.toEqual({ ok: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.example.test/v1/orders?page=2");
    expect(init.headers["User-Agent"]).toBe("1 - SelfIntegration");
    expect(init.headers.Authorization).toBe("Basic abc");
  });

  it("serializes JSON bodies on POST", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200));
    const client = createHttpClient({ baseUrl: "https://x.test", fetch: fetchMock });
    await client.post("/items", { body: { a: 1 } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe('{"a":1}');
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("returns undefined for empty bodies and text for non-JSON bodies", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 200 }))
      .mockResolvedValueOnce(new Response("plain", { status: 200 }));
    const client = createHttpClient({ baseUrl: "https://x.test", fetch: fetchMock });
    await expect(client.get("/a")).resolves.toBeUndefined();
    await expect(client.get("/b")).resolves.toBe("plain");
  });

  it("throws MarketplaceTimeoutError when the request exceeds timeoutMs", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_url: unknown, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    const client = createHttpClient({ baseUrl: "https://x.test", timeoutMs: 1000, fetch: fetchMock });
    const p = client.get("/slow");
    const assertion = expect(p).rejects.toBeInstanceOf(MarketplaceTimeoutError);
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it("rethrows non-timeout network errors unchanged", async () => {
    const boom = new Error("ECONNRESET");
    const client = createHttpClient({ baseUrl: "https://x.test", fetch: vi.fn().mockRejectedValue(boom) });
    await expect(client.get("/a")).rejects.toBe(boom);
  });

  it("retries GET on 429 honoring Retry-After seconds", async () => {
    const sleep = vi.fn(noSleep);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(429, {}, { "Retry-After": "2" }))
      .mockResolvedValueOnce(json(200, { done: true }));
    const client = createHttpClient({ baseUrl: "https://x.test", fetch: fetchMock, sleep });
    await expect(client.get("/a")).resolves.toEqual({ done: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it("supports Retry-After as an HTTP date", async () => {
    const sleep = vi.fn(noSleep);
    const now = Date.parse("2026-01-01T00:00:00Z");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(503, {}, { "Retry-After": "Thu, 01 Jan 2026 00:00:03 GMT" }))
      .mockResolvedValueOnce(json(200));
    const client = createHttpClient({ baseUrl: "https://x.test", fetch: fetchMock, sleep, now: () => now });
    await client.get("/a");
    expect(sleep).toHaveBeenCalledWith(3000);
  });

  it("uses capped exponential backoff without Retry-After", async () => {
    const sleep = vi.fn(noSleep);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(502))
      .mockResolvedValueOnce(json(503))
      .mockResolvedValueOnce(json(504))
      .mockResolvedValueOnce(json(200));
    const client = createHttpClient({
      baseUrl: "https://x.test",
      fetch: fetchMock,
      sleep,
      baseDelayMs: 100,
      maxDelayMs: 250,
    });
    await client.get("/a");
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([100, 200, 250]);
  });

  it.each(["POST", "PUT", "DELETE"] as const)("does not retry %s", async (method) => {
    const fetchMock = vi.fn().mockResolvedValue(json(503, { e: 1 }));
    const client = createHttpClient({ baseUrl: "https://x.test", fetch: fetchMock, sleep: noSleep });
    await expect(client.request(method, "/a")).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry non-retryable statuses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(401));
    const client = createHttpClient({ baseUrl: "https://x.test", fetch: fetchMock, sleep: noSleep });
    await expect(client.get("/a")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws an error carrying the original status once retries are exhausted", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => json(429, { msg: "x".repeat(2000) }));
    const client = createHttpClient({ baseUrl: "https://x.test", fetch: fetchMock, sleep: noSleep, maxRetries: 2 });
    const err = (await client.get("/a").catch((e: unknown) => e)) as MarketplaceHttpError;
    expect(err).toBeInstanceOf(MarketplaceHttpError);
    expect(err.status).toBe(429);
    expect(err.body.length).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("never logs the Authorization value", async () => {
    const calls: unknown[] = [];
    const log: HttpLogger = {
      debug: (o) => calls.push(o),
      warn: (o) => calls.push(o),
    };
    const fetchMock = vi.fn().mockResolvedValueOnce(json(429)).mockResolvedValueOnce(json(200));
    const client = createHttpClient({
      baseUrl: "https://x.test",
      headers: { "X-Api-Key": "key-123" },
      authorization: () => "Basic super-secret",
      fetch: fetchMock,
      sleep: noSleep,
      log,
    });
    await client.get("/a", { query: { token: "q-secret" } });
    const logged = JSON.stringify(calls);
    expect(logged).toContain("[REDACTED]");
    expect(logged).not.toContain("super-secret");
    expect(logged).not.toContain("key-123");
    expect(logged).not.toContain("q-secret");
  });
});

describe("maskHeaders", () => {
  it("redacts credential headers only", () => {
    expect(maskHeaders({ Authorization: "a", Cookie: "b", "X-Auth-Token": "c", "User-Agent": "ua" })).toEqual({
      Authorization: "[REDACTED]",
      Cookie: "[REDACTED]",
      "X-Auth-Token": "[REDACTED]",
      "User-Agent": "ua",
    });
  });
});

describe("RateLimiter", () => {
  it("rejects a non-positive rate", () => {
    expect(() => new RateLimiter({ requestsPerSecond: 0 })).toThrow();
  });

  it("does not exceed the limit under concurrent requests", async () => {
    vi.useFakeTimers();
    const limiter = new RateLimiter({ requestsPerSecond: 2, burst: 2 });
    const times: number[] = [];
    const start = Date.now();
    const all = Promise.all(
      Array.from({ length: 6 }, async () => {
        await limiter.acquire();
        times.push(Date.now() - start);
      }),
    );
    await vi.advanceTimersByTimeAsync(5000);
    await all;
    expect(times).toHaveLength(6);
    // Burst of 2 immediately, then one per 500ms.
    expect(times.filter((t) => t === 0)).toHaveLength(2);
    expect(times[2]).toBeGreaterThanOrEqual(500);
    for (let i = 3; i < times.length; i++) expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(500);
  });

  it("is applied by the client", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockImplementation(async () => json(200));
    const client = createHttpClient({
      baseUrl: "https://x.test",
      fetch: fetchMock,
      rateLimit: { requestsPerSecond: 1, burst: 1 },
    });
    const all = Promise.all([client.get("/a"), client.get("/b"), client.get("/c")]);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2000);
    await all;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("errorHandler mapping", () => {
  const app = (err: Error) => {
    const a = express();
    a.get("/x", (_req, _res, next) => next(err));
    a.use(errorHandler);
    return a;
  };

  it("maps timeouts to 504 and upstream errors to 502 without leaking details", async () => {
    const t = await request(app(new MarketplaceTimeoutError("GET", "/a", 1))).get("/x");
    expect(t.status).toBe(504);
    expect(t.body.error.code).toBe("UPSTREAM_TIMEOUT");
    const h = await request(app(new MarketplaceHttpError(500, "GET", "/a", "secret body"))).get("/x");
    expect(h.status).toBe(502);
    expect(h.body.error.code).toBe("UPSTREAM_ERROR");
    expect(JSON.stringify(h.body)).not.toContain("secret body");
  });
});
