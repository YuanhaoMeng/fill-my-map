import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type { RewardRepository } from "../../core/contracts";
import type { CityCompletionUnlock, LandmarkUnlock, TravelMode } from "../../core/types";
import { appSchema } from "./appSchema";

export class LocalRewardRepository implements RewardRepository {
  private constructor(
    private readonly database: SQLiteDatabase,
    private readonly regionVersion: string,
  ) {}

  static async open(regionVersion: string) {
    const database = await openDatabaseAsync("fill-my-map.sqlite");
    await database.execAsync(appSchema);
    return new LocalRewardRepository(database, regionVersion);
  }

  async unlockLandmark(unlock: LandmarkUnlock) {
    await this.database.runAsync(
      "INSERT OR IGNORE INTO landmark_unlocks VALUES (?, ?, ?)",
      unlock.landmarkId,
      unlock.unlockedAt,
      unlock.sessionId,
    );
  }

  async unlockCityCompletion(unlock: CityCompletionUnlock) {
    await this.database.runAsync(
      "INSERT OR IGNORE INTO city_completion_unlocks VALUES (?, ?, ?, ?, ?)",
      this.regionVersion,
      unlock.cityId,
      unlock.mode,
      unlock.unlockedAt,
      unlock.sessionId,
    );
  }

  async listLandmarkUnlocks() {
    return this.database.getAllAsync<{ landmark_id: string; unlocked_at: number; session_id: string }>(
      "SELECT * FROM landmark_unlocks ORDER BY unlocked_at DESC",
    );
  }

  async listCityCompletionUnlocks() {
    return this.database.getAllAsync<{ city_id: string; mode: TravelMode; unlocked_at: number; session_id: string }>(
      `SELECT city_id, mode, unlocked_at, session_id FROM city_completion_unlocks
       WHERE region_version=? ORDER BY unlocked_at DESC`,
      this.regionVersion,
    );
  }
}
