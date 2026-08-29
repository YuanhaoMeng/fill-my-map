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

  it("normalizes a v2 overview and place catalog", () => {
    const entry = {
      id: "southeast-michigan-50mi", displayName: "Southeast Michigan", version: "2026-v1",
      sizeBytes: 123, sha256: hash, kind: "overview", networkProfile: "arterial",
      downloadUrl: "https://github.com/YuanhaoMeng/fill-my-map/releases/download/maps-v3/overview.fillmap",
    };
    const catalog = parseCityCatalog({ formatVersion: 2, packages: [entry] });
    expect(catalog.cities[0]).toMatchObject({ kind: "overview", networkProfile: "arterial" });
  });

  it("accepts a dual-source trail manifest", () => {
    const trail = {
      ...manifest, formatVersion: 2, id: "pinckney-state-recreation-area", city: undefined,
      kind: "place", parentId: "southeast-michigan-50mi", networkProfile: "trail",
      area: { id: "pinckney-state-recreation-area", name: "Pinckney State Recreation Area", osmRef: "relation/5664016", center: [-83.973, 42.4156] },
      source: undefined,
      sources: [
        { name: "OpenStreetMap", snapshot: "michigan.osm.pbf", url: "https://download.geofabrik.de", license: "ODbL-1.0" },
        { name: "Michigan DNR", snapshot: "query.json", url: "https://gisagoegle.state.mi.us", license: "Public record" },
      ],
    };
    expect(parseCityManifest(trail).networkProfile).toBe("trail");
  });
});
