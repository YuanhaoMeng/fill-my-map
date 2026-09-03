import { describe, expect, it } from "vitest";
import type { FeatureCollection, Polygon } from "geojson";
import { isInsideBoundary, shouldAutoFollow, userViewportBounds } from "./cameraPolicy";

const boundaries: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [[[-84, 42], [-83, 42], [-83, 43], [-84, 43], [-84, 42]]],
    },
  }],
};

describe("camera policy", () => {
  it("allows park following only inside the real boundary", () => {
    expect(isInsideBoundary([-83.5, 42.5], boundaries)).toBe(true);
    expect(isInsideBoundary([-82.9, 42.5], boundaries)).toBe(false);
    expect(shouldAutoFollow(false, [-83.5, 42.5], boundaries)).toBe(false);
    expect(shouldAutoFollow(true, [-82.9, 42.5], boundaries)).toBe(false);
    expect(shouldAutoFollow(true, [-83.5, 42.5], boundaries)).toBe(true);
  });

  it("creates an approximately 50-mile radius overview viewport", () => {
    const bounds = userViewportBounds([-83.612, 42.241]);
    expect(bounds[3] - bounds[1]).toBeCloseTo(100 / 69, 5);
    expect(bounds[0]).toBeLessThan(-83.612);
    expect(bounds[2]).toBeGreaterThan(-83.612);
  });
});
