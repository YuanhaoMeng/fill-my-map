import type { RewardEngine } from "../../core/contracts";
import { distanceM } from "../../core/geo";
import type { CityProgress, Coordinate, TrackPoint } from "../../core/types";

export interface RewardLandmark {
  id: string;
  coordinate: Coordinate;
  radiusM: number;
}

export class DefaultRewardEngine implements RewardEngine {
  constructor(private readonly configuredLandmarks: readonly RewardLandmark[]) {}

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
