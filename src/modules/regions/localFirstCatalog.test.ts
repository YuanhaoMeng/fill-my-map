import { describe, expect, it, vi } from "vitest";
import type { CityCatalog } from "./cityPackTypes";
import { loadCatalogLocalFirst } from "./localFirstCatalog";

const empty: CityCatalog = { formatVersion: 2, cities: [] };
const fresh: CityCatalog = {
  formatVersion: 2,
  cities: [{
    id: "place",
    displayName: "Place",
    version: "v1",
    sizeBytes: 1,
    sha256: "a".repeat(64),
    downloadUrl: "https://github.com/YuanhaoMeng/fill-my-map/releases/download/maps/place.fillmap",
  }],
};

describe("local-first catalog loading", () => {
  it("returns cached data without waiting for the network refresh", async () => {
    let finishRefresh: (value: CityCatalog) => void = () => undefined;
    const refresh = new Promise<CityCatalog>((resolve) => { finishRefresh = resolve; });
    const onRefresh = vi.fn();
    await expect(loadCatalogLocalFirst(async () => empty, () => refresh, onRefresh)).resolves.toBe(empty);
    expect(onRefresh).not.toHaveBeenCalled();
    finishRefresh(fresh);
    await refresh;
    await Promise.resolve();
    expect(onRefresh).toHaveBeenCalledWith(fresh);
  });

  it("keeps cached data when refresh fails", async () => {
    const onRefresh = vi.fn();
    await expect(loadCatalogLocalFirst(
      async () => empty,
      async () => { throw new Error("offline"); },
      onRefresh,
    )).resolves.toBe(empty);
    await Promise.resolve();
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
