import { describe, expect, it } from "vitest";
import { parseCityCatalog, parseCityManifest } from "./validateCityPack";

const hash = "a".repeat(64);
const manifest = {
  formatVersion: 1,
  id: "ann-arbor",
  displayName: "Ann Arbor",
  version: "2026-v1",
  createdAt: "2026-08-24T00:00:00Z",
  bounds: [-83.81, 42.21, -83.665, 42.334],
  sha256: { basemap: hash, network: hash },
  source: { name: "OSM", snapshot: "snapshot.pbf", url: "https://example.com" },
  license: { data: "ODbL-1.0", attribution: "© OpenStreetMap contributors", url: "https://osm.org" },
  city: { id: "ann-arbor", name: "Ann Arbor", relationId: 135130 },
};

describe("city map validation", () => {
  it("accepts a versioned ODbL city manifest", () => {
    expect(parseCityManifest(manifest).id).toBe("ann-arbor");
  });

  it("rejects invalid bounds and missing attribution", () => {
    expect(() => parseCityManifest({ ...manifest, bounds: [0, 1, 0, 2] })).toThrow("bounds");
    expect(() => parseCityManifest({ ...manifest, license: { data: "ODbL-1.0" } })).toThrow("license");
  });

  it("only accepts the static release host", () => {
    const entry = {
      id: "ann-arbor",
      displayName: "Ann Arbor",
      version: "2026-v1",
      sizeBytes: 123,
      sha256: hash,
      downloadUrl: "https://github.com/YuanhaoMeng/fill-my-map/releases/download/maps-v1/a.fillmap",
    };
    expect(parseCityCatalog({ formatVersion: 1, cities: [entry] }).cities).toHaveLength(1);
    expect(() => parseCityCatalog({ formatVersion: 1, cities: [{ ...entry, downloadUrl: "https://maps.test/a" }] }))
      .toThrow("host");
  });
});
