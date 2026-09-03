export type MapPackKind = "city" | "overview" | "place";
export type NetworkProfile = "street" | "arterial" | "trail" | "none";

export interface CityPackManifest {
  formatVersion: 1 | 2;
  id: string;
  displayName: string;
  version: string;
  createdAt: string;
  bounds: readonly [number, number, number, number];
  sha256: { basemap: string; network: string };
  source?: { name: string; snapshot: string; url: string };
  sources?: readonly { name: string; snapshot: string; url: string; license: string }[];
  license: { data: "ODbL-1.0"; attribution: string; url: string };
  city?: { id: string; name: string; relationId: number };
  kind?: MapPackKind;
  parentId?: string;
  networkProfile?: NetworkProfile;
  area?: { id: string; name: string; osmRef: string; center: readonly [number, number]; radiusMiles?: number };
}

export interface CityCatalogEntry {
  id: string;
  displayName: string;
  version: string;
  sizeBytes: number;
  sha256: string;
  downloadUrl: string;
  kind?: MapPackKind;
  parentId?: string;
  networkProfile?: NetworkProfile;
}

export interface CityCatalog {
  formatVersion: 1 | 2;
  cities: readonly CityCatalogEntry[];
}

export interface InstalledCity {
  manifest: CityPackManifest;
  basemapUri: string;
  networkUri: string;
}
