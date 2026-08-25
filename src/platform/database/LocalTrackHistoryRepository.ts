import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type { TrackHistoryRepository } from "../../core/contracts";
import type { SessionSummary, TravelMode } from "../../core/types";
import { appSchema } from "./appSchema";

export class LocalTrackHistoryRepository implements TrackHistoryRepository {
  private constructor(private readonly database: SQLiteDatabase) {}

  static async open() {
    const database = await openDatabaseAsync("fill-my-map.sqlite");
    await database.execAsync(appSchema);
    return new LocalTrackHistoryRepository(database);
  }

  async listSessions(): Promise<readonly SessionSummary[]> {
    const rows = await this.database.getAllAsync<Record<string, string | number | null>>(
      `SELECT s.*, count(p.id) point_count FROM sessions s LEFT JOIN track_points p ON p.session_id=s.id
       GROUP BY s.id ORDER BY s.started_at DESC`,
    );
    return rows.map((row) => ({
      id: String(row.id),
      mode: String(row.mode) as TravelMode,
      startedAt: Number(row.started_at),
      endedAt: row.ended_at === null ? null : Number(row.ended_at),
      status: String(row.status) as SessionSummary["status"],
      pointCount: Number(row.point_count),
    }));
  }

  async getTrack(sessionId: string) {
    const rows = await this.database.getAllAsync<Record<string, number | null>>(
      "SELECT * FROM track_points WHERE session_id=? ORDER BY recorded_at",
      sessionId,
    );
    return rows.map((row) => ({
      sessionId,
      recordedAt: Number(row.recorded_at),
      coordinate: [Number(row.longitude), Number(row.latitude)] as const,
      accuracyM: Number(row.accuracy),
      speedMps: row.speed ?? null,
      headingDeg: row.heading ?? null,
    }));
  }

  async deleteTrack(sessionId: string) {
    await this.database.runAsync("DELETE FROM track_points WHERE session_id=?", sessionId);
  }

  async deleteAllTracks() {
    await this.database.runAsync("DELETE FROM track_points");
  }

  async resetAllData() {
    await this.database.withTransactionAsync(async () => {
      for (const table of [
        "track_points",
        "sessions",
        "visited_samples",
        "edge_progress",
        "exclusions",
        "landmark_unlocks",
        "city_completion_unlocks",
      ]) {
        await this.database.execAsync(`DELETE FROM ${table}`);
      }
    });
  }
}
