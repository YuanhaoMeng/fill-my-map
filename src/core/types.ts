export type TravelMode = "walk" | "drive";
export type Coordinate = readonly [longitude: number, latitude: number];
export type SessionStatus = "active" | "completed" | "interrupted";
export type ExclusionReason = "private" | "closed" | "unsafe" | "map_error" | "other";
export type CoverageVisualState = "unvisited" | "walk" | "drive" | "both" | "excluded";

export interface RegionManifest {
  id: string;
  version: string;
  createdAt: string;
  sha256: { basemap: string; network: string };
  source: { name: string; snapshot: string; url: string };
  license: { data: "ODbL-1.0"; attribution: string; url: string };
  cities: readonly { id: string; name: string; relationId: number }[];
}

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
  mode: TravelMode;
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
  modes: readonly TravelMode[];
  sampleCount: number;
}

export interface CoverageSample {
  id: string;
  edgeId: string;
  coordinate: Coordinate;
  edgeBearingDeg: number;
}

export interface CityProgress {
  cityId: string;
  mode: TravelMode;
  completedEdges: number;
  eligibleEdges: number;
  excludedEdges: number;
  percent: number;
}

export interface LandmarkUnlock {
  landmarkId: string;
  unlockedAt: number;
  sessionId: string;
}

export interface LandmarkRewardState extends LandmarkUnlock {
  kind: "landmark";
  name: string;
  cityId: string;
}

export interface CityCompletionUnlock {
  cityId: string;
  mode: TravelMode;
  unlockedAt: number;
  sessionId: string;
}

export interface CityRewardState extends CityCompletionUnlock {
  kind: "city";
}

export type RewardState = LandmarkRewardState | CityRewardState;

export interface EdgeExclusion {
  edgeId: string;
  mode: TravelMode;
  reason: ExclusionReason;
  createdAt: number;
}

export interface MissingEdge {
  id: string;
  name: string | null;
}
