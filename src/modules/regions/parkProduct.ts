import type { CityCatalogEntry, InstalledCity } from "./cityPackTypes";

const RETIRED_PACK_IDS = new Set(["county-farm-park"]);

export const downloadableParks = (items: readonly CityCatalogEntry[]) =>
  items.filter((item) => item.kind === "place" &&
    item.parentId === "united-states-overview" && !RETIRED_PACK_IDS.has(item.id));

export function shouldRetireInstalled(map: InstalledCity, bundled: InstalledCity) {
  const sameAsBundled = map.manifest.id === bundled.manifest.id &&
    map.manifest.version === bundled.manifest.version;
  const obsoletePlace = map.manifest.kind === "place" && map.manifest.parentId !== bundled.manifest.id;
  return (map.manifest.kind === "overview" && !sameAsBundled) || obsoletePlace || RETIRED_PACK_IDS.has(map.manifest.id);
}
