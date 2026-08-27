import { describe, expect, it } from "vitest";
import { gpx } from "./gpx";

describe("GPX export", () => {
  it("writes an ordered local track", () => {
    const output = gpx(
      { id: "s1", cityId: "ann-arbor", regionVersion: "v2", startedAt: 0, endedAt: 1, status: "completed", pointCount: 1 },
      [
        {
          sessionId: "s1",
          recordedAt: 0,
          coordinate: [-83.7, 42.2],
          accuracyM: 5,
          speedMps: 1,
          headingDeg: 90,
        },
      ],
    );
    expect(output).toContain('lat="42.2" lon="-83.7"');
    expect(output).toContain("1970-01-01T00:00:00.000Z");
  });
});
