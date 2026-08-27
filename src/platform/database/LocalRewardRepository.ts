import type { SQLiteDatabase } from "expo-sqlite";
import type { RewardRepository } from "../../core/contracts";
import type { CityCompletionUnlock, LandmarkUnlock } from "../../core/types";
import { openAppDatabase } from "./openAppDatabase";

export class LocalRewardRepository implements RewardRepository {
  private constructor(
    private readonly database: SQLiteDatabase,
    private readonly cityId: string,
    private readonly regionVersion: string,
  ) {}

  static async open(cityId: string, regionVersion: string) {
    return new LocalRewardRepository(await openAppDatabase(), cityId, regionVersion);
  }

  async unlockLandmark(unlock: LandmarkUnlock) {
    await this.database.runAsync(
      "INSERT OR IGNORE INTO landmark_unlocks VALUES (?, ?, ?, ?)",
      this.cityId,
      unlock.landmarkId,
      unlock.unlockedAt,
      unlock.sessionId,
    );
  }

  async unlockCityCompletion(unlock: CityCompletionUnlock) {
    await this.database.runAsync(
      "INSERT OR IGNORE INTO city_completion_unlocks VALUES (?, ?, ?, ?)",
      this.cityId,
      this.regionVersion,
      unlock.unlockedAt,
      unlock.sessionId,
    );
  }

  async listLandmarkUnlocks() {
    return this.database.getAllAsync<{ landmark_id: string; unlocked_at: number; session_id: string }>(
      "SELECT landmark_id, unlocked_at, session_id FROM landmark_unlocks WHERE city_id=? ORDER BY unlocked_at DESC",
      this.cityId,
    );
  }

  async listCityCompletionUnlocks() {
    return this.database.getAllAsync<{ city_id: string; unlocked_at: number; session_id: string }>(
      `SELECT city_id, unlocked_at, session_id FROM city_completion_unlocks
       WHERE city_id=? AND region_version=? ORDER BY unlocked_at DESC`,
      this.cityId,
      this.regionVersion,
    );
  }
}
