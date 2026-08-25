import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type { TravelMode } from "../../core/types";
import { appSchema } from "./appSchema";

export class LocalCoverageStatusRepository {
  private constructor(
    private readonly database: SQLiteDatabase,
    private readonly regionVersion: string,
  ) {}

  static async open(regionVersion: string) {
    const database = await openDatabaseAsync("fill-my-map.sqlite");
    await database.execAsync(appSchema);
    return new LocalCoverageStatusRepository(database, regionVersion);
  }

  async getModeEdgeStatus(mode: TravelMode) {
    const completed = await this.database.getAllAsync<{ edge_id: string }>(
      "SELECT edge_id FROM edge_progress WHERE region_version=? AND mode=? AND completed=1",
      this.regionVersion,
      mode,
    );
    const excluded = await this.database.getAllAsync<{ edge_id: string }>(
      "SELECT edge_id FROM exclusions WHERE mode=?",
      mode,
    );
    return { completed: completed.map((row) => row.edge_id), excluded: excluded.map((row) => row.edge_id) };
  }
}
