import { describe, expect, it } from "vitest";
import type { ResolvedSample } from "../../core/contracts";
import { coverageSegments } from "./coverageSegments";

const samples: ResolvedSample[] = [
  { sampleId: "1", edgeId: "a", cityId: "ann-arbor", sampleCount: 5, coordinate: [-83.7, 42.2], bearingDeg: 90 },
  { sampleId: "2", edgeId: "b", cityId: "ann-arbor", sampleCount: 5, coordinate: [-83.6, 42.3], bearingDeg: 0 },
];

describe("partial coverage state", () => {
  it("keeps walk and drive samples isolated and combines only the same sample", () => {
    const result = coverageSegments([
      { sample_id: "1", edge_id: "a", mode: "walk" },
      { sample_id: "1", edge_id: "a", mode: "drive" },
      { sample_id: "2", edge_id: "b", mode: "drive" },
    ], samples);
    expect(result.map(({ id, state }) => [id, state])).toEqual([["1", "both"], ["2", "drive"]]);
  });

  it("returns a partial segment before an edge reaches its completion threshold", () => {
    const result = coverageSegments([{ sample_id: "1", edge_id: "a", mode: "walk" }], samples);
    expect(result).toMatchObject([{ id: "1", edgeId: "a", state: "walk" }]);
  });
});
