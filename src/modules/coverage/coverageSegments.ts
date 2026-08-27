import type { ResolvedSample } from "../../core/contracts";
import type { CoverageSegment } from "../../core/types";

export interface VisitedSampleRow {
  sample_id: string;
  edge_id: string;
}

export function coverageSegments(
  rows: readonly VisitedSampleRow[],
  samples: readonly ResolvedSample[],
): CoverageSegment[] {
  const visitedIds = new Set(rows.map((row) => row.sample_id));
  return samples.flatMap((sample) => {
    if (!visitedIds.has(sample.sampleId)) return [];
    return [{
      id: sample.sampleId,
      edgeId: sample.edgeId,
      coordinate: sample.coordinate,
      bearingDeg: sample.bearingDeg,
    }];
  });
}
