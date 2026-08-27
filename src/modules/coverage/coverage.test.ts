import { describe, expect, it } from "vitest";
import type { MatchCandidate } from "../../core/contracts";
import type { TrackPoint } from "../../core/types";
import { DefaultCoverageMatcher } from "./DefaultCoverageMatcher";
import { cleanTrack } from "./cleanTrack";
import { edgeIsComplete, progressPercent } from "./progress";

function point(overrides: Partial<TrackPoint> = {}): TrackPoint {
  return {
    sessionId: "s1",
    recordedAt: 0,
    coordinate: [-83.75, 42.28],
    accuracyM: 5,
    speedMps: 1,
    headingDeg: 90,
    ...overrides,
  };
}

function candidate(overrides: Partial<MatchCandidate> = {}): MatchCandidate {
  return {
    id: "sample-a",
    edgeId: "edge-a",
    coordinate: [-83.75, 42.28],
    edgeBearingDeg: 90,
    distanceM: 5,
    ...overrides,
  };
}

describe("coverage progress", () => {
  it("completes an edge at the 80 percent sample threshold", () => {
    expect(edgeIsComplete(3, 5)).toBe(false);
    expect(edgeIsComplete(4, 5)).toBe(true);
    expect(edgeIsComplete(0, 0)).toBe(false);
  });

  it("reports bounded city percentages", () => {
    expect(progressPercent(1, 4)).toBe(25);
    expect(progressPercent(3, 0)).toBe(0);
    expect(progressPercent(6, 5)).toBe(100);
  });
});

describe("track cleaning", () => {
  it("rejects inaccurate and implausibly fast fixes", () => {
    const result = cleanTrack([
      point(),
      point({ recordedAt: 1_000, coordinate: [-83.7, 42.28] }),
      point({ recordedAt: 2_000, accuracyM: 80 }),
    ]);
    expect(result.points).toHaveLength(1);
    expect(result.rejectedPoints).toBe(2);
  });

  it("interpolates valid movement densely enough for 15 metre samples", () => {
    const result = cleanTrack([
      point(),
      point({ recordedAt: 20_000, coordinate: [-83.7497, 42.28] }),
    ]);
    expect(result.points.length).toBeGreaterThan(3);
    expect(result.rejectedPoints).toBe(0);
  });
});

describe("coverage matching", () => {
  it("uses heading and continuity when nearby roads compete", async () => {
    let query = 0;
    const result = await new DefaultCoverageMatcher().match([
      point(),
      point({ recordedAt: 5_000, coordinate: [-83.74995, 42.28] }),
    ], async () => {
      query += 1;
      return query === 1
        ? [candidate(), candidate({ id: "wrong", edgeId: "edge-b", edgeBearingDeg: 0, distanceM: 1 })]
        : [candidate({ id: `same-${query}` }), candidate({ id: `near-${query}`, edgeId: "edge-b", distanceM: 2 })];
    });
    expect(result.matchedEdgeIds).toEqual(["edge-a"]);
    expect(result.rejectedPoints).toBe(0);
  });
});
