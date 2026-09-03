import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import overviewAsset from "../../../assets/maps/united-states-overview.zip";

export const BUNDLED_OVERVIEW_ID = "united-states-overview";
export const BUNDLED_OVERVIEW_VERSION = "2026.09.03-v5";

export async function bundledOverviewArchive() {
  const asset = Asset.fromModule(overviewAsset);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error("Bundled overview map is unavailable");
  return new File(asset.localUri);
}
