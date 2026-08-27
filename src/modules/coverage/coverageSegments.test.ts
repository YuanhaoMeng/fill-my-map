import { describe, expect, it } from "vitest";
import type { ResolvedSample } from "../../core/contracts";
import { coverageSegments } from "./coverageSegments";

const samples: ResolvedSample[] = [
  { sampleId: "1", edgeId: "a", cityId: "ann-arbor", sampleCount: 5, coordinate: [-83.7, 42.2], bearingDeg: 90 },
  { sampleId: "2", edgeId: "b", cityId: "ann-arbor", sampleCount: 5, coordinate: [-83.6, 42.3], bearingDeg: 0 },
];

describe("partial coverage state", () => {
  it("deduplicates visited samples", () => {
    const result = coverageSegments([
      { sample_id: "1", edge_id: "a" },
      { sample_id: "1", edge_id: "a" },
      { sample_id: "2", edge_id: "b" },
    ], samples);
    expect(result.map(({ id }) => id)).toEqual(["1", "2"]);
  });

  it("returns a partial segment before an edge reaches its completion threshold", () => {
    const result = coverageSegments([{ sample_id: "1", edge_id: "a" }], samples);
    expect(result).toMatchObject([{ id: "1", edgeId: "a" }]);
  });
});
