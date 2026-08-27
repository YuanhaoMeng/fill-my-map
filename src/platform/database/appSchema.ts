import type { SQLiteDatabase } from "expo-sqlite";

export const APP_SCHEMA_VERSION = 2;

export const appSchema = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS sessions(
  id TEXT PRIMARY KEY, city_id TEXT NOT NULL, region_version TEXT NOT NULL,
  started_at INTEGER NOT NULL, ended_at INTEGER, status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS track_points(
  id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, recorded_at INTEGER NOT NULL,
  longitude REAL NOT NULL, latitude REAL NOT NULL, accuracy REAL NOT NULL,
  speed REAL, heading REAL, FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS visited_samples(
  city_id TEXT NOT NULL, region_version TEXT NOT NULL, sample_id TEXT NOT NULL, edge_id TEXT NOT NULL,
  PRIMARY KEY(city_id, region_version, sample_id)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS edge_progress(
  city_id TEXT NOT NULL, region_version TEXT NOT NULL, edge_id TEXT NOT NULL,
  visited_count INTEGER NOT NULL, sample_count INTEGER NOT NULL, completed INTEGER NOT NULL,
  PRIMARY KEY(city_id, region_version, edge_id)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS exclusions(
  city_id TEXT NOT NULL, edge_id TEXT NOT NULL, reason TEXT NOT NULL, created_at INTEGER NOT NULL,
  PRIMARY KEY(city_id, edge_id)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS landmark_unlocks(
  city_id TEXT NOT NULL, landmark_id TEXT NOT NULL, unlocked_at INTEGER NOT NULL, session_id TEXT NOT NULL,
  PRIMARY KEY(city_id, landmark_id)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS city_completion_unlocks(
  city_id TEXT NOT NULL, region_version TEXT NOT NULL, unlocked_at INTEGER NOT NULL, session_id TEXT NOT NULL,
  PRIMARY KEY(city_id, region_version)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS track_session_time ON track_points(session_id, recorded_at);
CREATE INDEX IF NOT EXISTS edge_progress_city ON edge_progress(city_id, region_version, completed);
CREATE INDEX IF NOT EXISTS exclusions_city ON exclusions(city_id);
PRAGMA user_version=2;
`;

export async function ensureAppSchema(database: SQLiteDatabase) {
  const row = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  if (row?.user_version === APP_SCHEMA_VERSION) {
    await database.execAsync(appSchema);
    return;
  }
  await database.execAsync(`
    PRAGMA foreign_keys=OFF;
    DROP TABLE IF EXISTS track_points;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS visited_samples;
    DROP TABLE IF EXISTS edge_progress;
    DROP TABLE IF EXISTS exclusions;
    DROP TABLE IF EXISTS landmark_unlocks;
    DROP TABLE IF EXISTS city_completion_unlocks;
    ${appSchema}
  `);
}
