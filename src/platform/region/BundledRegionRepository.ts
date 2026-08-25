import { Asset } from "expo-asset";
import { digest, CryptoDigestAlgorithm } from "expo-crypto";
import { File } from "expo-file-system";
import type { RegionFiles, RegionRepository } from "../../core/contracts";
import type { RegionManifest } from "../../core/types";
import manifestJson from "../../../assets/regions/ann-arbor-ypsilanti/manifest.json";
import { BASEMAP_ASSET, NETWORK_ASSET } from "./assets";

const manifest = manifestJson as RegionManifest;

export class BundledRegionRepository implements RegionRepository {
  async loadBundled(): Promise<RegionFiles> {
    const [basemap, network] = await Promise.all([
      Asset.fromModule(BASEMAP_ASSET).downloadAsync(),
      Asset.fromModule(NETWORK_ASSET).downloadAsync(),
    ]);
    if (!basemap.localUri || !network.localUri) throw new Error("Bundled region assets are missing");
    const files = { manifest, basemapUri: basemap.localUri, networkUri: network.localUri };
    await this.verify(files);
    return files;
  }

  async verify(files: RegionFiles) {
    const [basemap, network] = await Promise.all([
      fileSha256(files.basemapUri),
      fileSha256(files.networkUri),
    ]);
    if (basemap !== files.manifest.sha256.basemap || network !== files.manifest.sha256.network) {
      throw new Error("Bundled region checksum mismatch");
    }
  }
}

async function fileSha256(uri: string) {
  const result = await digest(CryptoDigestAlgorithm.SHA256, await new File(uri).bytes());
  return [...new Uint8Array(result)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
