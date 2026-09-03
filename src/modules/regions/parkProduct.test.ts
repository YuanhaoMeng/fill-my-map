import { describe, expect, it } from "vitest";
import type { CityCatalogEntry, InstalledCity } from "./cityPackTypes";
import { downloadableParks, shouldRetireInstalled } from "./parkProduct";

const entry = (id: string, kind: CityCatalogEntry["kind"]): CityCatalogEntry => ({
  id, kind, displayName: id, version: "v", sizeBytes: 1, sha256: "a".repeat(64),
  parentId: kind === "place" ? "united-states-overview" : undefined,
  downloadUrl: `https://github.com/YuanhaoMeng/fill-my-map/releases/download/test/${id}.fillmap`,
});
const installed = (id: string, kind: InstalledCity["manifest"]["kind"], version = "v", parentId?: string): InstalledCity => ({
  manifest: {
    formatVersion: 2, id, kind, displayName: id, version, createdAt: "now", bounds: [0, 0, 1, 1],
    parentId, networkProfile: kind === "overview" ? "none" : "trail", area: { id, name: id, osmRef: "test/1", center: [0, 0] },
    sha256: { basemap: "a".repeat(64), network: "b".repeat(64) }, sources: [],
    license: { data: "ODbL-1.0", attribution: "© OpenStreetMap contributors", url: "test" },
  }, basemapUri: "map", networkUri: "network",
});

describe("park product migration", () => {
  it("offers only supported on-demand park packs", () => {
    expect(downloadableParks([
      entry("old-overview", "overview"), entry("county-farm-park", "place"), entry("pinckney", "place"),
    ]).map((item) => item.id)).toEqual(["pinckney"]);
  });

  it("retires old overviews and County Farm but keeps the bundled overview", () => {
    const bundled = installed("united-states-overview", "overview", "v4");
    expect(shouldRetireInstalled(installed("old-overview", "overview"), bundled)).toBe(true);
    expect(shouldRetireInstalled(installed("county-farm-park", "place"), bundled)).toBe(true);
    expect(shouldRetireInstalled(installed("old-pinckney", "place"), bundled)).toBe(true);
    expect(shouldRetireInstalled(installed("pinckney", "place", "v4", bundled.manifest.id), bundled)).toBe(false);
    expect(shouldRetireInstalled(bundled, bundled)).toBe(false);
  });
});
