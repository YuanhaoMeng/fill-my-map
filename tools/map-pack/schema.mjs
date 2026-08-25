export const schema = `
PRAGMA journal_mode=OFF;
PRAGMA synchronous=OFF;
PRAGMA page_size=4096;
CREATE TABLE metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID;
CREATE TABLE cities(id TEXT PRIMARY KEY, name TEXT NOT NULL, relation_id INTEGER NOT NULL, geometry_json TEXT NOT NULL) WITHOUT ROWID;
CREATE TABLE edges(id TEXT PRIMARY KEY, city_id TEXT NOT NULL, osm_id TEXT NOT NULL, name TEXT, walk INTEGER NOT NULL, drive INTEGER NOT NULL, sample_count INTEGER NOT NULL, geometry_json TEXT NOT NULL, min_lon REAL NOT NULL, max_lon REAL NOT NULL, min_lat REAL NOT NULL, max_lat REAL NOT NULL) WITHOUT ROWID;
CREATE TABLE samples(id INTEGER PRIMARY KEY, edge_id TEXT NOT NULL, longitude REAL NOT NULL, latitude REAL NOT NULL, bearing REAL NOT NULL);
CREATE VIRTUAL TABLE sample_index USING rtree(id, min_lon, max_lon, min_lat, max_lat);
CREATE TABLE landmarks(id TEXT PRIMARY KEY, city_id TEXT NOT NULL, name TEXT NOT NULL, longitude REAL NOT NULL, latitude REAL NOT NULL, radius_m REAL NOT NULL, osm_ref TEXT NOT NULL) WITHOUT ROWID;
CREATE INDEX edges_city ON edges(city_id);
CREATE INDEX samples_edge ON samples(edge_id);
`;
