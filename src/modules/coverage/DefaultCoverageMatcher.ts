import type { CoverageMatcher, MatchCandidate } from "../../core/contracts";
import { undirectedHeadingDifference } from "../../core/geo";
import type { TrackPoint } from "../../core/types";
import { cleanTrack } from "./cleanTrack";

const MAX_HEADING_DIFFERENCE_DEG = 70;
const HEADING_SCORE_WEIGHT = 0.12;
const CONTINUITY_BONUS = 6;

export class DefaultCoverageMatcher implements CoverageMatcher {
  async match(points: Parameters<CoverageMatcher["match"]>[0], nearby: Parameters<CoverageMatcher["match"]>[1]) {
    const cleaned = cleanTrack(points);
    const visited = new Set<string>();
    const edges = new Set<string>();
    let rejectedPoints = cleaned.rejectedPoints;
    let previousEdgeId: string | null = null;
    for (const point of cleaned.points) {
      const candidate = chooseCandidate(await nearby(point), point, previousEdgeId);
      if (!candidate) {
        rejectedPoints += 1;
        continue;
      }
      visited.add(candidate.id);
      edges.add(candidate.edgeId);
      previousEdgeId = candidate.edgeId;
    }
    return {
      visitedSampleIds: [...visited],
      matchedEdgeIds: [...edges],
      rejectedPoints,
    };
  }
}

function chooseCandidate(
  candidates: readonly MatchCandidate[],
  point: TrackPoint,
  previousEdgeId: string | null,
) {
  const scored = candidates.flatMap((candidate) => {
    const difference = point.headingDeg === null
      ? 0
      : undirectedHeadingDifference(point.headingDeg, candidate.edgeBearingDeg);
    if (!Number.isFinite(candidate.distanceM) || difference > MAX_HEADING_DIFFERENCE_DEG) return [];
    const continuity = candidate.edgeId === previousEdgeId ? CONTINUITY_BONUS : 0;
    return [{ candidate, score: candidate.distanceM + difference * HEADING_SCORE_WEIGHT - continuity }];
  });
  scored.sort((a, b) => a.score - b.score || a.candidate.id.localeCompare(b.candidate.id));
  return scored[0]?.candidate;
}
