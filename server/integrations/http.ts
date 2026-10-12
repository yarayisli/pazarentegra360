import { logger as rootLogger } from "../logger";

export class MarketplaceHttpError extends Error {
  constructor(
    readonly status: number,
    readonly method: string,
    readonly path: string,
    /** Truncated response body, for diagnostics only. */
    readonly body: string,
  ) {
    super(`Marketplace request failed: ${method} ${path} -> ${status}`);
    this.name = "MarketplaceHttpError";
  }
}

export class MarketplaceTimeoutError extends Error {
  constructor(
    readonly method: string,
    readonly path: string,
    readonly timeoutMs: number,
  ) {
    super(`Marketplace request timed out after ${timeoutMs}ms: ${method} ${path}`);
    this.name = "MarketplaceTimeoutError";
  }
}

const SENSITIVE_HEADER = /^(authorization|proxy-authorization|cookie|set-cookie)$|token|secret|key|password/i;

/** Replaces values of credential-bearing headers so they never reach the logs. */
export function maskHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    out[name] = SENSITIVE_HEADER.test(name) ? "[REDACTED]" : value;
  }
  return out;
}

export interface RateLimitOptions {
  /** Sustained rate. Per-marketplace value comes from its verified docs, never guessed here. */
  requestsPerSecond: number;
  /** Bucket size; defaults to `requestsPerSecond` (at least 1). */
  burst?: number;
}

type Sleep = (ms: number) => Promise<void>;
const defaultSleep: Sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Token bucket. Callers are served strictly in order, so concurrency cannot exceed the limit. */
export class RateLimiter {
  private tokens: number;
  private last: number;
  private chain: Promise<void> = Promise.resolve();
  private readonly capacity: number;

  constructor(
    private readonly options: RateLimitOptions,
    private readonly sleep: Sleep = defaultSleep,
    private readonly now: () => number = Date.now,
  ) {
    if (!(options.requestsPerSecond > 0)) throw new Error("requestsPerSecond must be positive");
    this.capacity = Math.max(1, options.burst ?? options.requestsPerSecond);
    this.tokens = this.capacity;
    this.last = now();
  }

  acquire(): Promise<void> {
    const run = this.chain.then(() => this.take());
    this.chain = run.catch(() => undefined);
    return run;
  }

  private async take(): Promise<void> {
    for (;;) {
      const t = this.now();
      this.tokens = Math.min(this.capacity, this.tokens + ((t - this.last) / 1000) * this.options.requestsPerSecond);
      this.last = t;
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      await this.sleep(Math.ceil(((1 - this.tokens) / this.options.requestsPerSecond) * 1000));
    }
  }
}

export interface HttpLogger {
  debug: (obj: object, msg?: string) => void;
  warn: (obj: object, msg?: string) => void;
}

export interface HttpClientOptions {
  baseUrl: string;
  /** Static headers (e.g. `User-Agent`). */
  headers?: Record<string, string>;
  /** Produces the `Authorization` header value per request. */
  authorization?: () => string | Promise<string>;
  timeoutMs?: number;
  /** Extra attempts after the first, GET only. */
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  rateLimit?: RateLimitOptions;
  log?: HttpLogger;
  // Injection points for tests.
  fetch?: typeof fetch;
  sleep?: Sleep;
  now?: () => number;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  log?: HttpLogger;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const MAX_BODY_SNIPPET = 500;

function retryAfterMs(header: string | null, now: number): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
}

export function createHttpClient(options: HttpClientOptions) {
  const {
    baseUrl,
    timeoutMs = 10_000,
    maxRetries = 3,
    baseDelayMs = 500,
    maxDelayMs = 30_000,
    sleep = defaultSleep,
    now = Date.now,
  } = options;
  const doFetch = options.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  const limiter = options.rateLimit ? new RateLimiter(options.rateLimit, sleep, now) : undefined;

  async function attempt(method: HttpMethod, path: string, url: URL, headers: Record<string, string>, body?: string) {
    await limiter?.acquire();
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    try {
      const res = await doFetch(url, { method, headers, body, signal: controller.signal });
      const text = await res.text();
      return { res, text };
    } catch (err) {
      if (timedOut) throw new MarketplaceTimeoutError(method, path, timeoutMs);
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async function request<T = unknown>(method: HttpMethod, path: string, opts: RequestOptions = {}): Promise<T> {
    const log = opts.log ?? options.log ?? rootLogger;
    const url = new URL(path.replace(/^\//, ""), baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
    const headers: Record<string, string> = { Accept: "application/json", ...options.headers, ...opts.headers };
    if (options.authorization) headers.Authorization = await options.authorization();
    const body = opts.body === undefined ? undefined : JSON.stringify(opts.body);
    if (body !== undefined && !Object.keys(headers).some((h) => h.toLowerCase() === "content-type")) {
      headers["Content-Type"] = "application/json";
    }
    const retries = method === "GET" ? maxRetries : 0;

    for (let n = 0; ; n++) {
      const started = now();
      const { res, text } = await attempt(method, path, url, headers, body);
      // Query strings can carry credentials, so only the path is logged.
      log.debug(
        {
          method,
          path,
          status: res.status,
          attempt: n + 1,
          durationMs: now() - started,
          headers: maskHeaders(headers),
        },
        "marketplace request",
      );
      if (res.ok) {
        if (!text) return undefined as T;
        try {
          return JSON.parse(text) as T;
        } catch {
          return text as T;
        }
      }
      if (n < retries && RETRYABLE_STATUS.has(res.status)) {
        const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** n);
        const delay = Math.min(maxDelayMs, retryAfterMs(res.headers.get("retry-after"), now()) ?? backoff);
        log.warn({ method, path, status: res.status, retryInMs: delay }, "marketplace request will be retried");
        await sleep(delay);
        continue;
      }
      throw new MarketplaceHttpError(res.status, method, path, text.slice(0, MAX_BODY_SNIPPET));
    }
  }

  return {
    request,
    get: <T = unknown>(path: string, opts?: RequestOptions) => request<T>("GET", path, opts),
    post: <T = unknown>(path: string, opts?: RequestOptions) => request<T>("POST", path, opts),
    put: <T = unknown>(path: string, opts?: RequestOptions) => request<T>("PUT", path, opts),
    delete: <T = unknown>(path: string, opts?: RequestOptions) => request<T>("DELETE", path, opts),
  };
}

export type MarketplaceHttpClient = ReturnType<typeof createHttpClient>;
