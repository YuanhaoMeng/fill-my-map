import type { CityPackManifest } from "./cityPackTypes";

export interface MapCapabilities {
  exploration: boolean;
  progress: boolean;
  roadExclusions: boolean;
}

export function mapCapabilities(manifest?: Pick<CityPackManifest, "kind">): MapCapabilities {
  const exploration = manifest?.kind !== "overview";
  return {
    exploration,
    progress: exploration,
    roadExclusions: exploration,
  };
}
