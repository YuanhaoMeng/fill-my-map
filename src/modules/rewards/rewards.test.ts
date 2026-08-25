import { describe, expect, it } from "vitest";
import type { TrackPoint } from "../../core/types";
import { DefaultRewardEngine } from "./DefaultRewardEngine";

describe("reward engine", () => {
  it("unlocks a landmark in either travel mode", () => {
    const point: TrackPoint = {
      sessionId: "walk-session",
      recordedAt: 1,
      coordinate: [-83.7487, 42.2658],
      accuracyM: 5,
      speedMps: 1,
      headingDeg: null,
    };
    expect(new DefaultRewardEngine().unlockedLandmarks([point])).toContain("aa-stadium");
  });

  it("requires a nonempty fully completed city", () => {
    const engine = new DefaultRewardEngine();
    expect(
      engine.cityCompleted({
        cityId: "ann-arbor",
        mode: "walk",
        completedEdges: 9,
        eligibleEdges: 10,
        excludedEdges: 2,
        percent: 90,
      }),
    ).toBe(false);
    expect(
      engine.cityCompleted({
        cityId: "ann-arbor",
        mode: "drive",
        completedEdges: 10,
        eligibleEdges: 10,
        excludedEdges: 0,
        percent: 100,
      }),
    ).toBe(true);
  });
});
