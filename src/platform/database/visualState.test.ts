import { describe, expect, it } from "vitest";
import { visualState } from "./visualState";

describe("coverage visual state", () => {
  it("renders completed roads with the single explored state", () => {
    expect(visualState(new Set(["explored"]))).toBe("explored");
  });

  it("keeps exclusions visible after an edge was completed", () => {
    expect(visualState(new Set(["explored", "excluded"]))).toBe("excluded");
  });
});
