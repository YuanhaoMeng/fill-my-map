export interface CityPackManifest {
  formatVersion: 1;
  id: string;
  displayName: string;
  version: string;
  createdAt: string;
  bounds: readonly [number, number, number, number];
  sha256: { basemap: string; network: string };
  source: { name: string; snapshot: string; url: string };
  license: { data: "ODbL-1.0"; attribution: string; url: string };
  city: { id: string; name: string; relationId: number };
}

export interface CityCatalogEntry {
  id: string;
  displayName: string;
  version: string;
  sizeBytes: number;
  sha256: string;
  downloadUrl: string;
}

export interface CityCatalog {
  formatVersion: 1;
  cities: readonly CityCatalogEntry[];
}

export interface InstalledCity {
  manifest: CityPackManifest;
  basemapUri: string;
  networkUri: string;
}
