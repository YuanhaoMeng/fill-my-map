import { describe, expect, it } from "vitest";
import type { TrackPoint } from "../../core/types";
import { DefaultRewardEngine } from "./DefaultRewardEngine";

describe("reward engine", () => {
  it("unlocks a nearby landmark", () => {
    const point: TrackPoint = {
      sessionId: "walk-session",
      recordedAt: 1,
      coordinate: [-83.7487, 42.2658],
      accuracyM: 5,
      speedMps: 1,
      headingDeg: null,
    };
    expect(new DefaultRewardEngine([{ id: "stadium", coordinate: [-83.7487, 42.2658], radiusM: 75 }]).unlockedLandmarks([point])).toContain("stadium");
  });

  it("requires a nonempty fully completed city", () => {
    const engine = new DefaultRewardEngine([]);
    expect(
      engine.cityCompleted({
        cityId: "ann-arbor",
        completedEdges: 9,
        eligibleEdges: 10,
        excludedEdges: 2,
        percent: 90,
      }),
    ).toBe(false);
    expect(
      engine.cityCompleted({
        cityId: "ann-arbor",
        completedEdges: 10,
        eligibleEdges: 10,
        excludedEdges: 0,
        percent: 100,
      }),
    ).toBe(true);
  });
});
