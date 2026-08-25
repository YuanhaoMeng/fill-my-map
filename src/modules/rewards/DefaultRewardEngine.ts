import type { RewardEngine } from "../../core/contracts";
import { distanceM } from "../../core/geo";
import type { CityProgress, TrackPoint } from "../../core/types";
import { landmarks, type Landmark } from "./landmarks";

export class DefaultRewardEngine implements RewardEngine {
  constructor(private readonly configuredLandmarks: readonly Landmark[] = landmarks) {}

  cityCompleted(progress: CityProgress) {
    return progress.eligibleEdges > 0 && progress.completedEdges >= progress.eligibleEdges;
  }

  unlockedLandmarks(points: readonly TrackPoint[]) {
    return this.configuredLandmarks
      .filter((landmark) =>
        points.some((point) => distanceM(point.coordinate, landmark.coordinate) <= landmark.radiusM),
      )
      .map((landmark) => landmark.id);
  }
}
