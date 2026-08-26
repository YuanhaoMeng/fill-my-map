import type { FeatureCollection, LineString, MultiLineString, MultiPolygon, Point, Polygon } from "geojson";
import type { StyleSpecification } from "@maplibre/maplibre-react-native";
import type {
  CityProgress,
  RewardState,
  MissingEdge,
  TrackingSession,
  TravelMode,
  Coordinate,
} from "../../core/types";
import type { ExplorationService } from "../exploration/ExplorationService";
import type { LocalProgressRepository } from "../../platform/database/LocalProgressRepository";
import type { LocalTrackHistoryRepository } from "../../platform/database/LocalTrackHistoryRepository";

export interface MapContent {
  style: StyleSpecification;
  boundaries: FeatureCollection<Polygon | MultiPolygon>;
  edges: FeatureCollection<LineString>;
  partialCoverage: FeatureCollection<MultiLineString>;
  landmarks: FeatureCollection<Point>;
  history?: FeatureCollection<LineString>;
  historyMode?: TravelMode;
}

export interface RuntimeState {
  status: "loading" | "ready" | "error";
  map?: MapContent;
  session: TrackingSession | null;
  progress: readonly CityProgress[];
  actionError: string | null;
  rewards: readonly RewardState[];
  userCoordinate?: Coordinate;
}

export interface RuntimeResources {
  service?: ExplorationService;
  progress?: LocalProgressRepository;
  history?: LocalTrackHistoryRepository;
  refresh?: (ids?: readonly string[], reset?: boolean) => Promise<void>;
  refreshRewards?: () => Promise<void>;
  loadProgress?: () => Promise<readonly CityProgress[]>;
  listMissing?: (cityId: string, mode: TravelMode) => Promise<readonly MissingEdge[]>;
}
