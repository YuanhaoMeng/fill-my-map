import { randomUUID } from "expo-crypto";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type { CoverageCatalog, CoverageStateRepository, ProgressRepository } from "../../core/contracts";
import type {
  EdgeExclusion,
  TrackingSession,
  TrackPoint,
  TravelMode,
} from "../../core/types";
import { edgeIsComplete, progressPercent } from "../../modules/coverage/progress";
import { appSchema } from "./appSchema";
import { LocalCoverageStateReader } from "./LocalCoverageStateReader";

export class LocalProgressRepository implements ProgressRepository, CoverageStateRepository {
  private readonly coverageState: LocalCoverageStateReader;

  private constructor(
    private readonly database: SQLiteDatabase,
    private readonly catalog: CoverageCatalog,
    private readonly regionVersion: string,
  ) {
    this.coverageState = new LocalCoverageStateReader(database, catalog, regionVersion);
  }

  static async open(catalog: CoverageCatalog, regionVersion: string) {
    const database = await openDatabaseAsync("fill-my-map.sqlite");
    await database.execAsync(appSchema);
    return new LocalProgressRepository(database, catalog, regionVersion);
  }

  async recoverInterruptedSessions() {
    await this.database.runAsync(
      "UPDATE sessions SET status='interrupted', ended_at=COALESCE(ended_at, ?) WHERE status='active'",
      Date.now(),
    );
  }

  async createSession(mode: TravelMode): Promise<TrackingSession> {
    const session: TrackingSession = {
      id: randomUUID(),
      mode,
      startedAt: Date.now(),
      endedAt: null,
      status: "active",
    };
    await this.database.runAsync(
      "INSERT INTO sessions(id, mode, started_at, status) VALUES (?, ?, ?, ?)",
      session.id,
      mode,
      session.startedAt,
      session.status,
    );
    return session;
  }

  async finishSession(id: string, status: TrackingSession["status"]) {
    await this.database.runAsync("UPDATE sessions SET ended_at=?, status=? WHERE id=?", Date.now(), status, id);
  }

  async appendTrack(points: readonly TrackPoint[]) {
    await this.database.withTransactionAsync(async () => {
      for (const point of points) {
        await this.database.runAsync(
          `INSERT INTO track_points(session_id, recorded_at, longitude, latitude, accuracy, speed, heading)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          point.sessionId,
          point.recordedAt,
          point.coordinate[0],
          point.coordinate[1],
          point.accuracyM,
          point.speedMps,
          point.headingDeg,
        );
      }
    });
  }

  async saveVisitedSamples(regionVersion: string, mode: TravelMode, ids: readonly string[]) {
    if (regionVersion !== this.regionVersion || !ids.length) return;
    const samples = await this.catalog.resolveSamples(ids);
    const edges = new Map(samples.map((sample) => [sample.edgeId, sample]));
    await this.database.withTransactionAsync(async () => {
      for (const sample of samples) {
        await this.database.runAsync(
          "INSERT OR IGNORE INTO visited_samples VALUES (?, ?, ?, ?)",
          regionVersion,
          mode,
          sample.sampleId,
          sample.edgeId,
        );
      }
      for (const sample of edges.values()) await this.refreshEdge(sample, mode);
    });
  }

  private async refreshEdge(sample: Awaited<ReturnType<CoverageCatalog["resolveSamples"]>>[number], mode: TravelMode) {
    const row = await this.database.getFirstAsync<{ count: number }>(
      "SELECT count(*) count FROM visited_samples WHERE region_version=? AND mode=? AND edge_id=?",
      this.regionVersion,
      mode,
      sample.edgeId,
    );
    const count = row?.count ?? 0;
    await this.database.runAsync(
      `INSERT OR REPLACE INTO edge_progress VALUES (?, ?, ?, ?, ?, ?, ?)`,
      this.regionVersion,
      mode,
      sample.edgeId,
      sample.cityId,
      count,
      sample.sampleCount,
      edgeIsComplete(count, sample.sampleCount) ? 1 : 0,
    );
  }

  async getCityProgress(cityId: string, mode: TravelMode) {
    const total = await this.catalog.countEligibleEdges(cityId, mode);
    const excluded = await this.scalar(
      "SELECT count(*) count FROM exclusions WHERE city_id=? AND mode=?",
      cityId,
      mode,
    );
    const completed = await this.scalar(
      `SELECT count(*) count FROM edge_progress p WHERE p.region_version=? AND p.city_id=? AND p.mode=?
       AND p.completed=1 AND NOT EXISTS(SELECT 1 FROM exclusions x WHERE x.edge_id=p.edge_id AND x.mode=p.mode)`,
      this.regionVersion,
      cityId,
      mode,
    );
    const eligibleEdges = Math.max(0, total - excluded);
    return { cityId, mode, completedEdges: completed, eligibleEdges, excludedEdges: excluded, percent: progressPercent(completed, eligibleEdges) };
  }

  private async scalar(sql: string, ...params: (string | number)[]) {
    return (await this.database.getFirstAsync<{ count: number }>(sql, ...params))?.count ?? 0;
  }

  async exclude(exclusion: EdgeExclusion) {
    const city = await this.catalog.edgeCity(exclusion.edgeId);
    if (!city || !(await this.catalog.edgeEligible(exclusion.edgeId, exclusion.mode))) {
      throw new Error("Ineligible edge");
    }
    await this.database.runAsync(
      "INSERT OR REPLACE INTO exclusions VALUES (?, ?, ?, ?, ?)",
      exclusion.edgeId,
      city,
      exclusion.mode,
      exclusion.reason,
      exclusion.createdAt,
    );
  }

  async undoExclusion(edgeId: string, mode: TravelMode) {
    await this.database.runAsync("DELETE FROM exclusions WHERE edge_id=? AND mode=?", edgeId, mode);
  }

  getEdgeStates(ids?: readonly string[]) {
    return this.coverageState.getEdgeStates(ids);
  }

  getCoverageSegments(ids?: readonly string[]) {
    return this.coverageState.getCoverageSegments(ids);
  }
}
