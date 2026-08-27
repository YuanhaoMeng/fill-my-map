export type Coordinate = readonly [longitude: number, latitude: number];
export type SessionStatus = "active" | "completed" | "interrupted";
export type ExclusionReason = "private" | "closed" | "unsafe" | "map_error" | "other";
export type CoverageVisualState = "unvisited" | "explored" | "excluded";

export interface TrackPoint {
  sessionId: string;
  recordedAt: number;
  coordinate: Coordinate;
  accuracyM: number;
  speedMps: number | null;
  headingDeg: number | null;
}

export interface TrackingSession {
  id: string;
  cityId: string;
  regionVersion: string;
  startedAt: number;
  endedAt: number | null;
  status: SessionStatus;
}

export interface SessionSummary extends TrackingSession {
  pointCount: number;
}

export interface CoverageEdge {
  id: string;
  cityId: string;
  name: string | null;
  coordinates: readonly Coordinate[];
  sampleCount: number;
}

export interface CoverageSample {
  id: string;
  edgeId: string;
  coordinate: Coordinate;
  edgeBearingDeg: number;
}

export interface CoverageSegment {
  id: string;
  edgeId: string;
  coordinate: Coordinate;
  bearingDeg: number;
}

export interface CityProgress {
  cityId: string;
  completedEdges: number;
  eligibleEdges: number;
  excludedEdges: number;
  percent: number;
}

export interface LandmarkUnlock {
  cityId: string;
  landmarkId: string;
  unlockedAt: number;
  sessionId: string;
}

export interface LandmarkRewardState extends LandmarkUnlock {
  kind: "landmark";
  name: string;
}

export interface CityCompletionUnlock {
  cityId: string;
  unlockedAt: number;
  sessionId: string;
}

export interface CityRewardState extends CityCompletionUnlock {
  kind: "city";
}

export type RewardState = LandmarkRewardState | CityRewardState;

export interface EdgeExclusion {
  edgeId: string;
  reason: ExclusionReason;
  createdAt: number;
}

export interface MissingEdge {
  id: string;
  name: string | null;
}
