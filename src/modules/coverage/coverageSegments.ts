import type { ResolvedSample } from "../../core/contracts";
import type { CoverageModeState, CoverageSegment, TravelMode } from "../../core/types";

export interface VisitedSampleRow {
  sample_id: string;
  edge_id: string;
  mode: TravelMode;
}

export function coverageSegments(
  rows: readonly VisitedSampleRow[],
  samples: readonly ResolvedSample[],
): CoverageSegment[] {
  const modes = new Map<string, Set<TravelMode>>();
  rows.forEach((row) => {
    const current = modes.get(row.sample_id) ?? new Set<TravelMode>();
    current.add(row.mode);
    modes.set(row.sample_id, current);
  });
  return samples.flatMap((sample) => {
    const visited = modes.get(sample.sampleId);
    if (!visited) return [];
    return [{
      id: sample.sampleId,
      edgeId: sample.edgeId,
      coordinate: sample.coordinate,
      bearingDeg: sample.bearingDeg,
      state: modeState(visited),
    }];
  });
}

function modeState(modes: ReadonlySet<TravelMode>): CoverageModeState {
  if (modes.has("walk") && modes.has("drive")) return "both";
  return modes.has("walk") ? "walk" : "drive";
}
