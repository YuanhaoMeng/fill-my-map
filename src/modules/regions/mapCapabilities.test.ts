import { describe, expect, it } from "vitest";
import { mapCapabilities } from "./mapCapabilities";

describe("mapCapabilities", () => {
  it("keeps overview maps as non-explorable backgrounds", () => {
    expect(mapCapabilities({ kind: "overview" })).toEqual({
      exploration: false,
      progress: false,
      roadExclusions: false,
    });
  });

  it("allows exploration only in place and legacy city maps", () => {
    expect(mapCapabilities({ kind: "place" }).exploration).toBe(true);
    expect(mapCapabilities({ kind: "city" }).exploration).toBe(true);
    expect(mapCapabilities({}).exploration).toBe(true);
  });
});
