import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appSchema } from "./appSchema";

let testDirectory = "";

afterEach(() => {
  if (testDirectory) rmSync(testDirectory, { recursive: true });
  testDirectory = "";
});

describe("local SQLite lifecycle", () => {
  it("isolates progress and rewards by city and map version", () => {
    const database = openTestDatabase();
    const visit = database.prepare("INSERT INTO visited_samples VALUES (?, ?, ?, ?)");
    visit.run("ann-arbor", "v2", "sample-1", "edge-1");
    visit.run("ypsilanti", "v2", "sample-1", "edge-1");
    visit.run("ann-arbor", "v3", "sample-1", "edge-1");
    const completion = database.prepare("INSERT INTO city_completion_unlocks VALUES (?, ?, ?, ?)");
    completion.run("ann-arbor", "v2", 5, "s1");
    completion.run("ypsilanti", "v2", 6, "s2");
    expect(scalar(database, "SELECT count(*) count FROM visited_samples")).toBe(3);
    expect(scalar(database, "SELECT count(*) count FROM city_completion_unlocks")).toBe(2);
    expect(columns(database, "visited_samples")).not.toContain("mode");
    database.close();
  });

  it("restores partial sample coverage before an edge is complete", () => {
    const database = openTestDatabase();
    database.prepare("INSERT INTO visited_samples VALUES (?, ?, ?, ?)")
      .run("ann-arbor", "v2", "sample-1", "edge-1");
    database.prepare("INSERT INTO edge_progress VALUES (?, ?, ?, ?, ?, ?)")
      .run("ann-arbor", "v2", "edge-1", 1, 5, 0);
    database.close();
    const reopened = new DatabaseSync(databasePath());
    expect(scalar(reopened, "SELECT count(*) count FROM visited_samples")).toBe(1);
    expect(scalar(reopened, "SELECT count(*) count FROM edge_progress WHERE completed=0")).toBe(1);
    reopened.close();
  });

  it("deletes raw tracks without deleting progress", () => {
    const database = openTestDatabase();
    database.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?, ?, ?)")
      .run("s1", "ann-arbor", "v2", 1, 2, "completed");
    database.prepare(
      "INSERT INTO track_points(session_id, recorded_at, longitude, latitude, accuracy) VALUES (?, ?, ?, ?, ?)",
    ).run("s1", 1, -83.7, 42.2, 5);
    database.prepare("INSERT INTO edge_progress VALUES (?, ?, ?, ?, ?, ?)")
      .run("ann-arbor", "v2", "edge-1", 4, 5, 1);
    database.exec("DELETE FROM track_points");
    expect(scalar(database, "SELECT count(*) count FROM track_points")).toBe(0);
    expect(scalar(database, "SELECT count(*) count FROM edge_progress")).toBe(1);
    database.close();
  });
});

function openTestDatabase() {
  testDirectory = mkdtempSync(join(tmpdir(), "fill-my-map-schema-"));
  const database = new DatabaseSync(databasePath());
  database.exec(appSchema);
  return database;
}

function databasePath() {
  return join(testDirectory, "fill-my-map.sqlite");
}

function scalar(database: DatabaseSync, sql: string) {
  return Number((database.prepare(sql).get() as { count: number }).count);
}

function columns(database: DatabaseSync, table: string) {
  return database.prepare(`PRAGMA table_info(${table})`).all().map((row) => String((row as { name: string }).name));
}
