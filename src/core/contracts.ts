import type {
  CityProgress,
  CityCompletionUnlock,
  CoverageEdge,
  CoverageSample,
  EdgeExclusion,
  LandmarkUnlock,
  RegionManifest,
  TrackingSession,
  SessionSummary,
  TrackPoint,
  TravelMode,
  CoverageVisualState,
} from "./types";

export interface RegionFiles {
  manifest: RegionManifest;
  basemapUri: string;
  networkUri: string;
}

export interface RegionRepository {
  loadBundled(): Promise<RegionFiles>;
  verify(files: RegionFiles): Promise<void>;
}

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
    mode: TravelMode,
    nearby: (point: TrackPoint) => Promise<readonly MatchCandidate[]>,
  ): Promise<MatchResult>;
}

export interface ProgressRepository {
  createSession(mode: TravelMode): Promise<TrackingSession>;
  finishSession(id: string, status: TrackingSession["status"]): Promise<void>;
  appendTrack(points: readonly TrackPoint[]): Promise<void>;
  saveVisitedSamples(regionVersion: string, mode: TravelMode, ids: readonly string[]): Promise<void>;
  getCityProgress(cityId: string, mode: TravelMode): Promise<CityProgress>;
  exclude(exclusion: EdgeExclusion): Promise<void>;
  undoExclusion(edgeId: string, mode: TravelMode): Promise<void>;
}

export interface RewardRepository {
  unlockLandmark(unlock: LandmarkUnlock): Promise<void>;
  unlockCityCompletion(unlock: CityCompletionUnlock): Promise<void>;
  listLandmarkUnlocks(): Promise<readonly { landmark_id: string; unlocked_at: number; session_id: string }[]>;
  listCityCompletionUnlocks(): Promise<readonly { city_id: string; mode: TravelMode; unlocked_at: number; session_id: string }[]>;
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
  nearbySamples(point: TrackPoint, mode: TravelMode): Promise<readonly MatchCandidate[]>;
  listEdges(cityId: string): Promise<readonly CoverageEdge[]>;
}

export interface ResolvedSample {
  sampleId: string;
  edgeId: string;
  cityId: string;
  sampleCount: number;
}

export interface CoverageCatalog {
  resolveSamples(ids: readonly string[]): Promise<readonly ResolvedSample[]>;
  countEligibleEdges(cityId: string, mode: TravelMode): Promise<number>;
  edgeCity(edgeId: string): Promise<string | null>;
  edgeEligible(edgeId: string, mode: TravelMode): Promise<boolean>;
}

export interface CoverageStateRepository {
  recoverInterruptedSessions(): Promise<void>;
  getEdgeStates(ids?: readonly string[]): Promise<Readonly<Record<string, CoverageVisualState>>>;
}

export interface TrackHistoryRepository {
  listSessions(): Promise<readonly SessionSummary[]>;
  getTrack(sessionId: string): Promise<readonly TrackPoint[]>;
  deleteTrack(sessionId: string): Promise<void>;
  deleteAllTracks(): Promise<void>;
  resetAllData(): Promise<void>;
}
