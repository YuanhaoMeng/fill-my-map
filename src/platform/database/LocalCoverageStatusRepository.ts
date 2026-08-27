import type { SQLiteDatabase } from "expo-sqlite";
import { openAppDatabase } from "./openAppDatabase";

export class LocalCoverageStatusRepository {
  private constructor(
    private readonly database: SQLiteDatabase,
    private readonly cityId: string,
    private readonly regionVersion: string,
  ) {}

  static async open(cityId: string, regionVersion: string) {
    return new LocalCoverageStatusRepository(await openAppDatabase(), cityId, regionVersion);
  }

  async getEdgeStatus() {
    const completed = await this.database.getAllAsync<{ edge_id: string }>(
      "SELECT edge_id FROM edge_progress WHERE city_id=? AND region_version=? AND completed=1",
      this.cityId,
      this.regionVersion,
    );
    const excluded = await this.database.getAllAsync<{ edge_id: string }>(
      "SELECT edge_id FROM exclusions WHERE city_id=?",
      this.cityId,
    );
    return { completed: completed.map((row) => row.edge_id), excluded: excluded.map((row) => row.edge_id) };
  }
}
