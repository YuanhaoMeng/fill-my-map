import type { CityCatalogEntry, InstalledCity } from "./cityPackTypes";

export function catalogRows(
  catalog: readonly CityCatalogEntry[],
  installed: readonly InstalledCity[],
): readonly CityCatalogEntry[] {
  const missing = installed
    .filter((local) => !catalog.some((entry) => same(entry, local)))
    .map((local): CityCatalogEntry => ({
      id: local.manifest.id,
      displayName: local.manifest.displayName,
      version: local.manifest.version,
      sizeBytes: 0,
      sha256: local.manifest.sha256.network,
      downloadUrl: "installed://local",
      kind: local.manifest.kind ?? "city",
      parentId: local.manifest.parentId,
      networkProfile: local.manifest.networkProfile ?? "street",
    }));
  return [...catalog, ...missing];
}

const same = (entry: CityCatalogEntry, local: InstalledCity) =>
  entry.id === local.manifest.id && entry.version === local.manifest.version;
