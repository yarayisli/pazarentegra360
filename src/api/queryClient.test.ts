import { describe, expect, it } from "vitest";
import { ApiError } from "./client";
import { createQueryClient } from "./queryClient";

describe("createQueryClient", () => {
  const retry = createQueryClient().getDefaultOptions().queries!.retry as (n: number, e: Error) => boolean;

  it("does not retry 4xx errors", () => {
    expect(retry(0, new ApiError(404, "NOT_FOUND", "x"))).toBe(false);
  });
  it("retries server errors once", () => {
    expect(retry(0, new ApiError(500, "INTERNAL_ERROR", "x"))).toBe(true);
    expect(retry(1, new ApiError(500, "INTERNAL_ERROR", "x"))).toBe(false);
  });
});
