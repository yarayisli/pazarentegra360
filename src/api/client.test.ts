// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, setUnauthorizedHandler } from "./client";

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(null);
});

describe("apiFetch", () => {
  it("returns parsed JSON and builds the query string", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { success: true, items: [1] }));
    vi.stubGlobal("fetch", fetchMock);
    const out = await apiFetch<{ items: number[] }>("/api/x", { query: { a: 1, b: undefined, c: "z" } });
    expect(out.items).toEqual([1]);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/x?a=1&c=z");
  });

  it("sends JSON bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { success: true }));
    vi.stubGlobal("fetch", fetchMock);
    await apiFetch("/api/x", { method: "POST", body: { a: 1 } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"a":1}');
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("throws ApiError with server code and message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json(400, { success: false, error: { code: "BAD", message: "Hatalı" } })),
    );
    await expect(apiFetch("/api/x")).rejects.toMatchObject({ status: 400, code: "BAD", message: "Hatalı" });
  });

  it("falls back to a generic error for non-JSON failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 502 })));
    const err = await apiFetch("/api/x").catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 502, code: "UNKNOWN", message: "İstek başarısız oldu." });
  });

  it("calls the unauthorized handler on 401", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(json(401, { success: false, error: { code: "UNAUTHENTICATED", message: "Giriş gerekli" } })),
    );
    await expect(apiFetch("/api/x")).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("maps network failures to NETWORK_ERROR", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fail")));
    await expect(apiFetch("/api/x")).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });
});
