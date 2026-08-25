import { describe, expect, it } from "vitest";
import { visualState } from "./visualState";

describe("coverage visual state", () => {
  it("combines independent walk and drive completion", () => {
    expect(visualState(new Set(["walk", "drive"]))).toBe("both");
  });

  it("keeps exclusions visible after an edge was completed", () => {
    expect(visualState(new Set(["walk", "excluded"]))).toBe("excluded");
  });
});
