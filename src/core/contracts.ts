import type {
  CityCompletionUnlock,
  CityProgress,
  CoverageEdge,
  CoverageSample,
  CoverageSegment,
  CoverageVisualState,
  EdgeExclusion,
  LandmarkUnlock,
  SessionSummary,
  TrackingSession,
  TrackPoint,
} from "./types";

export interface LocationRecorder {
  requestPermission(): Promise<boolean>;
  start(sessionId: string): Promise<void>;
  stop(): Promise<void>;
  isRecording(): Promise<boolean>;
  subscribe(listener: (points: readonly TrackPoint[]) => void): () => void;
}

export interface MatchCandidate extends CoverageSample {
  distanceM: number;
}

export interface MatchResult {
  visitedSampleIds: readonly string[];
  matchedEdgeIds: readonly string[];
  rejectedPoints: number;
}

export interface CoverageMatcher {
  match(
    points: readonly TrackPoint[],
    nearby: (point: TrackPoint) => Promise<readonly MatchCandidate[]>,
  ): Promise<MatchResult>;
}

export interface ProgressRepository {
  createSession(): Promise<TrackingSession>;
  finishSession(id: string, status: TrackingSession["status"]): Promise<void>;
  appendTrack(points: readonly TrackPoint[]): Promise<void>;
  saveVisitedSamples(ids: readonly string[]): Promise<void>;
  getCityProgress(): Promise<CityProgress>;
  exclude(exclusion: EdgeExclusion): Promise<void>;
  undoExclusion(edgeId: string): Promise<void>;
}

export interface RewardRepository {
  unlockLandmark(unlock: LandmarkUnlock): Promise<void>;
  unlockCityCompletion(unlock: CityCompletionUnlock): Promise<void>;
  listLandmarkUnlocks(): Promise<readonly { landmark_id: string; unlocked_at: number; session_id: string }[]>;
  listCityCompletionUnlocks(): Promise<readonly { city_id: string; unlocked_at: number; session_id: string }[]>;
}

export interface RewardEngine {
  cityCompleted(progress: CityProgress): boolean;
  unlockedLandmarks(points: readonly TrackPoint[]): readonly string[];
}

export interface ShareCardRenderer {
  renderProgress(progress: CityProgress): Promise<string>;
  share(imageUri: string): Promise<void>;
}

export interface NetworkRepository {
  nearbySamples(point: TrackPoint): Promise<readonly MatchCandidate[]>;
  listEdges(cityId: string): Promise<readonly CoverageEdge[]>;
}

export interface ResolvedSample {
  sampleId: string;
  edgeId: string;
  cityId: string;
  sampleCount: number;
  coordinate: readonly [number, number];
  bearingDeg: number;
}

export interface CoverageCatalog {
  resolveSamples(ids: readonly string[]): Promise<readonly ResolvedSample[]>;
  countEligibleEdges(cityId: string): Promise<number>;
  edgeCity(edgeId: string): Promise<string | null>;
  edgeEligible(edgeId: string): Promise<boolean>;
}

export interface CoverageStateRepository {
  recoverInterruptedSessions(): Promise<void>;
  getEdgeStates(ids?: readonly string[]): Promise<Readonly<Record<string, CoverageVisualState>>>;
  getCoverageSegments(ids?: readonly string[]): Promise<readonly CoverageSegment[]>;
}

export interface TrackHistoryRepository {
  listSessions(): Promise<readonly SessionSummary[]>;
  getTrack(sessionId: string): Promise<readonly TrackPoint[]>;
  deleteTrack(sessionId: string): Promise<void>;
  deleteAllTracks(): Promise<void>;
  resetAllData(): Promise<void>;
}
