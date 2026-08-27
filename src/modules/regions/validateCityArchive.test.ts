import { describe, expect, it } from "vitest";
import { assertCityArchiveEntries } from "./validateCityArchive";

const valid = ["manifest.json", "basemap.pmtiles", "network.sqlite", "LICENSE.txt"]
  .map((path) => ({ path, size: 10, isDirectory: false }));

describe("city map archive safety", () => {
  it("accepts exactly the four package files", () => {
    expect(() => assertCityArchiveEntries(valid)).not.toThrow();
  });

  it("rejects missing, extra, and traversal paths", () => {
    expect(() => assertCityArchiveEntries(valid.slice(1))).toThrow("incomplete");
    expect(() => assertCityArchiveEntries([...valid, { path: "track.json", size: 1, isDirectory: false }]))
      .toThrow("path");
    expect(() => assertCityArchiveEntries([...valid.slice(1), { path: "../manifest.json", size: 1, isDirectory: false }]))
      .toThrow("path");
  });

  it("rejects decompression bombs", () => {
    expect(() => assertCityArchiveEntries(valid.map((entry) => ({ ...entry, size: 100_000_000 }))))
      .toThrow("large");
  });
});
