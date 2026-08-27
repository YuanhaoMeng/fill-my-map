import type { CityCatalogEntry, CityPackManifest } from "./cityPackTypes";

export const CITY_PACK_FILES = ["manifest.json", "basemap.pmtiles", "network.sqlite", "LICENSE.txt"] as const;
const MAX_UNPACKED_BYTES = 250_000_000;

export interface ArchiveEntry {
  path: string;
  size: number;
  isDirectory: boolean;
}

export function assertCityArchiveEntries(entries: readonly ArchiveEntry[]) {
  const files = entries.filter((entry) => !entry.isDirectory);
  const names = files.map((entry) => entry.path);
  const size = files.reduce((total, entry) => total + entry.size, 0);
  if (size > MAX_UNPACKED_BYTES) throw new Error("City map archive is too large");
  const allowed: readonly string[] = CITY_PACK_FILES;
  if (names.some((name) => name.startsWith("/") || name.includes("..") || !allowed.includes(name))) {
    throw new Error("Invalid city map archive path");
  }
  if (new Set(names).size !== CITY_PACK_FILES.length || !CITY_PACK_FILES.every((name) => names.includes(name))) {
    throw new Error("City map archive files are incomplete");
  }
}

export function assertCatalogMatch(manifest: CityPackManifest, expected: CityCatalogEntry) {
  if (manifest.id !== expected.id || manifest.version !== expected.version) {
    throw new Error("Downloaded city map does not match catalog");
  }
}
