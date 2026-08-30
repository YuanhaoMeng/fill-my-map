import type { Feature } from "geojson";
import { describe, expect, it } from "vitest";
import { placeHit, placeHitBounds } from "./placeHit";

const point = (name?: string, detailPackId?: string): Feature => ({
  type: "Feature",
  properties: name ? { name, ...(detailPackId ? { detailPackId } : {}) } : { point_count: 12 },
  geometry: { type: "Point", coordinates: [-83.7, 42.3] },
});

describe("park marker hit testing", () => {
  it("prefers an implemented park over an overlapping overview park", () => {
    expect(placeHit([point("Other"), point("Pinckney", "pinckney")])).toEqual({
      id: "pinckney",
      name: "Pinckney",
    });
  });

  it("ignores unnamed clusters and keeps unavailable park names", () => {
    expect(placeHit([point(), point("Other")])).toEqual({ id: null, name: "Other" });
    expect(placeHit([point()])).toBeNull();
  });

  it("uses a finger-sized query area around the tap", () => {
    expect(placeHitBounds([100, 200])).toEqual([[82, 182], [118, 218]]);
  });
});
