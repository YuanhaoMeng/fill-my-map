export const appSchema = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS sessions(
  id TEXT PRIMARY KEY, mode TEXT NOT NULL, started_at INTEGER NOT NULL,
  ended_at INTEGER, status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS track_points(
  id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, recorded_at INTEGER NOT NULL,
  longitude REAL NOT NULL, latitude REAL NOT NULL, accuracy REAL NOT NULL,
  speed REAL, heading REAL, FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS visited_samples(
  region_version TEXT NOT NULL, mode TEXT NOT NULL, sample_id TEXT NOT NULL, edge_id TEXT NOT NULL,
  PRIMARY KEY(region_version, mode, sample_id)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS edge_progress(
  region_version TEXT NOT NULL, mode TEXT NOT NULL, edge_id TEXT NOT NULL, city_id TEXT NOT NULL,
  visited_count INTEGER NOT NULL, sample_count INTEGER NOT NULL, completed INTEGER NOT NULL,
  PRIMARY KEY(region_version, mode, edge_id)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS exclusions(
  edge_id TEXT NOT NULL, city_id TEXT NOT NULL, mode TEXT NOT NULL, reason TEXT NOT NULL,
  created_at INTEGER NOT NULL, PRIMARY KEY(edge_id, mode)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS landmark_unlocks(
  landmark_id TEXT PRIMARY KEY, unlocked_at INTEGER NOT NULL, session_id TEXT NOT NULL
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS city_completion_unlocks(
  region_version TEXT NOT NULL, city_id TEXT NOT NULL, mode TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL, session_id TEXT NOT NULL,
  PRIMARY KEY(region_version, city_id, mode)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS track_session_time ON track_points(session_id, recorded_at);
CREATE INDEX IF NOT EXISTS edge_progress_city ON edge_progress(city_id, mode, completed);
CREATE INDEX IF NOT EXISTS exclusions_city ON exclusions(city_id, mode);
`;
