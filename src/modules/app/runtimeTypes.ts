import type { FeatureCollection, LineString, MultiLineString, MultiPolygon, Point, Polygon } from "geojson";
import type { StyleSpecification } from "@maplibre/maplibre-react-native";
import type {
  CityProgress,
  RewardState,
  MissingEdge,
  TrackingSession,
  Coordinate,
} from "../../core/types";
import type { ExplorationService } from "../exploration/ExplorationService";
import type { LocalProgressRepository } from "../../platform/database/LocalProgressRepository";
import type { LocalTrackHistoryRepository } from "../../platform/database/LocalTrackHistoryRepository";
import type { CityCatalogEntry, InstalledCity } from "../regions/cityPackTypes";

export interface MapContent {
  bounds: readonly [number, number, number, number];
  style: StyleSpecification;
  boundaries: FeatureCollection<Polygon | MultiPolygon>;
  edges: FeatureCollection<LineString>;
  partialCoverage: FeatureCollection<MultiLineString>;
  landmarks: FeatureCollection<Point>;
  history?: FeatureCollection<LineString>;
}

export interface RuntimeState {
  status: "loading" | "needs-map" | "ready" | "error";
  map?: MapContent;
  session: TrackingSession | null;
  progress: readonly CityProgress[];
  actionError: string | null;
  rewards: readonly RewardState[];
  userCoordinate?: Coordinate;
  maps: {
    catalog: readonly CityCatalogEntry[];
    installed: readonly InstalledCity[];
    active: InstalledCity | null;
    downloadProgress?: number;
  };
}

export interface RuntimeResources {
  service?: ExplorationService;
  progress?: LocalProgressRepository;
  history?: LocalTrackHistoryRepository;
  refresh?: (ids?: readonly string[], reset?: boolean) => Promise<void>;
  refreshRewards?: () => Promise<void>;
  loadProgress?: () => Promise<readonly CityProgress[]>;
  listMissing?: () => Promise<readonly MissingEdge[]>;
  dispose?: () => Promise<void>;
}
