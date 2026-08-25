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
  it("persists progress and rewards independently by travel mode", () => {
    const database = openTestDatabase();
    database.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?, ?)").run("walk", "walk", 1, 2, "completed");
    database.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?, ?)").run("drive", "drive", 3, 4, "completed");
    const visit = database.prepare("INSERT INTO visited_samples VALUES (?, ?, ?, ?)");
    visit.run("v1", "walk", "sample-1", "edge-1");
    visit.run("v1", "drive", "sample-1", "edge-1");
    const completion = database.prepare("INSERT INTO city_completion_unlocks VALUES (?, ?, ?, ?, ?)");
    completion.run("v1", "ann-arbor", "walk", 5, "walk");
    completion.run("v1", "ann-arbor", "drive", 6, "drive");
    completion.run("v1", "ypsilanti", "walk", 7, "walk");
    completion.run("v1", "ypsilanti", "drive", 8, "drive");
    database.prepare("INSERT OR IGNORE INTO city_completion_unlocks VALUES (?, ?, ?, ?, ?)")
      .run("v1", "ann-arbor", "walk", 9, "drive");
    database.close();
    const reopened = new DatabaseSync(databasePath());
    expect(scalar(reopened, "SELECT count(*) count FROM visited_samples")).toBe(2);
    expect(scalar(reopened, "SELECT count(*) count FROM city_completion_unlocks")).toBe(4);
    reopened.close();
  });

  it("deletes raw tracks without progress and supports exclusion undo and reset", () => {
    const database = openTestDatabase();
    database.prepare("INSERT INTO sessions VALUES (?, ?, ?, ?, ?)").run("s1", "walk", 1, 2, "completed");
    database.prepare(
      "INSERT INTO track_points(session_id, recorded_at, longitude, latitude, accuracy) VALUES (?, ?, ?, ?, ?)",
    ).run("s1", 1, -83.7, 42.2, 5);
    database.prepare("INSERT INTO edge_progress VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run("v1", "walk", "edge-1", "ann-arbor", 4, 5, 1);
    database.prepare("INSERT INTO exclusions VALUES (?, ?, ?, ?, ?)")
      .run("edge-1", "ann-arbor", "walk", "unsafe", 2);
    database.exec("DELETE FROM track_points; DELETE FROM exclusions;");
    expect(scalar(database, "SELECT count(*) count FROM track_points")).toBe(0);
    expect(scalar(database, "SELECT count(*) count FROM edge_progress")).toBe(1);
    expect(scalar(database, "SELECT count(*) count FROM exclusions")).toBe(0);
    database.exec("DELETE FROM sessions; DELETE FROM visited_samples; DELETE FROM edge_progress; DELETE FROM landmark_unlocks; DELETE FROM city_completion_unlocks;");
    expect(scalar(database, "SELECT count(*) count FROM edge_progress")).toBe(0);
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
