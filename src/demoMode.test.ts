import { describe, expect, it } from "vitest";
import { isDemoMode } from "./demoMode";

describe("isDemoMode", () => {
  it("is on with ?demo=1", () => expect(isDemoMode("?demo=1")).toBe(true));
  it("is off otherwise", () => {
    expect(isDemoMode("")).toBe(false);
    expect(isDemoMode("?demo=0")).toBe(false);
  });
});
