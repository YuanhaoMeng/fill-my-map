import { importDatabaseFromAssetAsync, openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type { CoverageCatalog, MatchCandidate, NetworkRepository, ResolvedSample } from "../../core/contracts";
import { distanceM } from "../../core/geo";
import type { Coordinate, CoverageEdge, TrackPoint, TravelMode } from "../../core/types";
import type { MultiPolygon, Polygon } from "geojson";
import { NETWORK_ASSET } from "../region/assets";

interface SampleRow {
  id: number;
  edge_id: string;
  longitude: number;
  latitude: number;
  bearing: number;
}

interface EdgeRow {
  id: string;
  city_id: string;
  name: string | null;
  walk: number;
  drive: number;
  sample_count: number;
  geometry_json: string;
}

export interface MapLandmark {
  id: string;
  cityId: string;
  name: string;
  coordinate: Coordinate;
  radiusM: number;
}

export interface MapCityBoundary {
  id: string;
  name: string;
  geometry: Polygon | MultiPolygon;
}

export class BundledNetworkRepository implements NetworkRepository, CoverageCatalog {
  private constructor(private readonly database: SQLiteDatabase) {}

  static async open(regionVersion: string) {
    const name = `network-${regionVersion}.sqlite`;
    await importDatabaseFromAssetAsync(name, { assetId: NETWORK_ASSET });
    const database = await openDatabaseAsync(name, { useNewConnection: true });
    await database.execAsync("PRAGMA query_only=ON");
    return new BundledNetworkRepository(database);
  }

  async nearbySamples(point: TrackPoint, mode: TravelMode): Promise<readonly MatchCandidate[]> {
    const radiusM = Math.min(30, Math.max(15, point.accuracyM));
    const latDelta = radiusM / 111_320;
    const lonDelta = latDelta / Math.cos((point.coordinate[1] * Math.PI) / 180);
    const [lon, lat] = point.coordinate;
    const rows = await this.database.getAllAsync<SampleRow>(
      `SELECT s.id, s.edge_id, s.longitude, s.latitude, s.bearing
       FROM sample_index i JOIN samples s ON s.id=i.id JOIN edges e ON e.id=s.edge_id
       WHERE i.min_lon<=? AND i.max_lon>=? AND i.min_lat<=? AND i.max_lat>=? AND e.${mode}=1`,
      lon + lonDelta,
      lon - lonDelta,
      lat + latDelta,
      lat - latDelta,
    );
    return rows
      .map((row) => ({
        id: String(row.id),
        edgeId: row.edge_id,
        coordinate: [row.longitude, row.latitude] as const,
        edgeBearingDeg: row.bearing,
        distanceM: distanceM(point.coordinate, [row.longitude, row.latitude]),
      }))
      .filter((sample) => sample.distanceM <= radiusM);
  }

  async listEdges(cityId: string): Promise<readonly CoverageEdge[]> {
    const rows = await this.database.getAllAsync<EdgeRow>("SELECT * FROM edges WHERE city_id=?", cityId);
    return rows.map((row) => ({
      id: row.id,
      cityId: row.city_id,
      name: row.name,
      coordinates: JSON.parse(row.geometry_json),
      modes: ([row.walk ? "walk" : null, row.drive ? "drive" : null] as const).filter(
        (mode): mode is TravelMode => mode !== null,
      ),
      sampleCount: row.sample_count,
    }));
  }

  async listLandmarks(): Promise<readonly MapLandmark[]> {
    const rows = await this.database.getAllAsync<Record<string, string | number>>("SELECT * FROM landmarks");
    return rows.map((row) => ({
      id: String(row.id),
      cityId: String(row.city_id),
      name: String(row.name),
      coordinate: [Number(row.longitude), Number(row.latitude)],
      radiusM: Number(row.radius_m),
    }));
  }

  async listCityBoundaries(): Promise<readonly MapCityBoundary[]> {
    const rows = await this.database.getAllAsync<{ id: string; name: string; geometry_json: string }>(
      "SELECT id, name, geometry_json FROM cities ORDER BY id",
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      geometry: JSON.parse(row.geometry_json) as Polygon | MultiPolygon,
    }));
  }

  async resolveSamples(ids: readonly string[]): Promise<readonly ResolvedSample[]> {
    const rows: (SampleRow & { city_id: string; sample_count: number })[] = [];
    for (let offset = 0; offset < ids.length; offset += 400) {
      const batch = ids.slice(offset, offset + 400);
      if (!batch.length) continue;
      rows.push(
        ...(await this.database.getAllAsync<SampleRow & { city_id: string; sample_count: number }>(
          `SELECT s.id, s.edge_id, e.city_id, e.sample_count FROM samples s JOIN edges e ON e.id=s.edge_id
           WHERE s.id IN (${batch.map(() => "?").join(",")})`,
          ...batch.map(Number),
        )),
      );
    }
    return rows.map((row) => ({
      sampleId: String(row.id),
      edgeId: row.edge_id,
      cityId: row.city_id,
      sampleCount: row.sample_count,
    }));
  }

  async countEligibleEdges(cityId: string, mode: TravelMode) {
    const row = await this.database.getFirstAsync<{ count: number }>(
      `SELECT count(*) count FROM edges WHERE city_id=? AND ${mode}=1`,
      cityId,
    );
    return row?.count ?? 0;
  }

  async edgeCity(edgeId: string) {
    const row = await this.database.getFirstAsync<{ city_id: string }>("SELECT city_id FROM edges WHERE id=?", edgeId);
    return row?.city_id ?? null;
  }

  async edgeEligible(edgeId: string, mode: TravelMode) {
    const row = await this.database.getFirstAsync<{ eligible: number }>(
      `SELECT ${mode} eligible FROM edges WHERE id=?`,
      edgeId,
    );
    return row?.eligible === 1;
  }

  async close() {
    await this.database.closeAsync();
  }
}
