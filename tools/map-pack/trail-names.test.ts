import { describe, expect, it } from "vitest";
import { nearestDnrTrailName, prepareDnrTrails } from "./trail-names.mjs";

describe("official trail naming", () => {
  it("uses a nearby named DNR trail and ignores distant geometry", () => {
    const trails = prepareDnrTrails({ layers: [{ features: [{
      properties: { TrailNamePrimary: "Potawatomi Trail" },
      geometry: { type: "LineString", coordinates: [[-84, 42], [-83.99, 42]] },
    }] }] });
    expect(nearestDnrTrailName([[-84, 42.0001], [-83.995, 42.0001]], trails)).toBe("Potawatomi Trail");
    expect(nearestDnrTrailName([[-84, 42.01], [-83.995, 42.01]], trails)).toBeNull();
  });
});
