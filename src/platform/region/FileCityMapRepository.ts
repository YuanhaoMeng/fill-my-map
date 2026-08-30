import { digest, CryptoDigestAlgorithm } from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import { listContents, unzip } from "react-native-zip-archive";
import type { CityCatalog, CityCatalogEntry, InstalledCity } from "../../modules/regions/cityPackTypes";
import { assertCatalogMatch, assertCityArchiveEntries, CITY_PACK_FILES } from "../../modules/regions/validateCityArchive";
import { parseCityCatalog, parseCityManifest } from "../../modules/regions/validateCityPack";

const CATALOG_URL = "https://yuanhaomeng.github.io/fill-my-map/maps/catalog.json";

export class FileCityMapRepository {
  private readonly root = new Directory(Paths.document, "city-maps");
  private readonly cities = new Directory(this.root, "cities");
  private readonly activeFile = new File(this.root, "active.json");
  private catalogRequest?: Promise<CityCatalog>;

  async loadCatalog(): Promise<CityCatalog> {
    if (this.catalogRequest) return this.catalogRequest;
    this.catalogRequest = this.fetchCatalog().catch((error) => {
      this.catalogRequest = undefined;
      throw error;
    });
    return this.catalogRequest;
  }

  private async fetchCatalog(): Promise<CityCatalog> {
    const destination = new File(Paths.cache, "fill-my-map-catalog.json");
    const downloaded = await File.downloadFileAsync(CATALOG_URL, destination, { idempotent: true });
    return parseCityCatalog(await downloaded.json());
  }

  async listInstalled(): Promise<readonly InstalledCity[]> {
    this.ensureRoots();
    const installed: InstalledCity[] = [];
    for (const city of this.cities.list()) {
      if (!(city instanceof Directory)) continue;
      for (const version of city.list()) {
        if (!(version instanceof Directory)) continue;
        try {
          installed.push(await this.readInstalled(version));
        } catch {
          // Incomplete staging from a terminated install is not a usable map.
        }
      }
    }
    return installed.sort((a, b) => a.manifest.displayName.localeCompare(b.manifest.displayName));
  }

  async getActive(): Promise<InstalledCity | null> {
    if (!this.activeFile.exists) return null;
    const active = await this.activeFile.json() as { id?: string; version?: string };
    if (!active.id || !active.version) return null;
    const directory = new Directory(this.cities, active.id, active.version);
    if (!directory.exists) return null;
    try {
      return await this.readInstalled(directory);
    } catch {
      return null;
    }
  }

  async download(entry: CityCatalogEntry, onProgress?: (fraction: number) => void) {
    const stage = this.makeStage();
    try {
      const archive = new File(stage, `${entry.id}.fillmap`);
      await File.downloadFileAsync(entry.downloadUrl, archive, {
        onProgress: ({ bytesWritten, totalBytes }) => onProgress?.(totalBytes ? bytesWritten / totalBytes : 0),
      });
      if (await fileSha256(archive) !== entry.sha256) throw new Error("Downloaded city map checksum mismatch");
      return await this.installArchive(archive, stage, entry);
    } finally {
      if (stage.exists) stage.delete();
    }
  }

  async importFromPicker(): Promise<InstalledCity | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/zip", "application/octet-stream"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return null;
    const stage = this.makeStage();
    try {
      return await this.installArchive(new File(result.assets[0]!.uri), stage);
    } finally {
      if (stage.exists) stage.delete();
    }
  }

  async activate(city: InstalledCity) {
    this.ensureRoots();
    await this.readInstalled(this.packageDirectory(city.manifest.id, city.manifest.version));
    this.activeFile.create({ overwrite: true });
    this.activeFile.write(JSON.stringify({ id: city.manifest.id, version: city.manifest.version }));
  }

  async delete(city: InstalledCity) {
    const active = await this.getActive();
    const directory = this.packageDirectory(city.manifest.id, city.manifest.version);
    if (directory.exists) directory.delete();
    if (active?.manifest.id === city.manifest.id && active.manifest.version === city.manifest.version) {
      this.activeFile.delete();
    }
  }

  private async installArchive(archive: File, stage: Directory, expected?: CityCatalogEntry) {
    const entries = await listContents(nativePath(archive.uri));
    assertCityArchiveEntries(entries);
    const unpacked = new Directory(stage, "unpacked");
    unpacked.create();
    await unzip(nativePath(archive.uri), nativePath(unpacked.uri), "UTF-8", [...CITY_PACK_FILES]);
    const city = await this.readInstalled(unpacked, true);
    if (expected) assertCatalogMatch(city.manifest, expected);
    const destination = this.packageDirectory(city.manifest.id, city.manifest.version);
    destination.parentDirectory.create({ intermediates: true, idempotent: true });
    if (destination.exists) throw new Error("City map version is already installed");
    await unpacked.move(destination);
    return this.readInstalled(destination);
  }

  private async readInstalled(directory: Directory, verify = false): Promise<InstalledCity> {
    const manifest = parseCityManifest(await new File(directory, "manifest.json").json());
    const basemap = new File(directory, "basemap.pmtiles");
    const network = new File(directory, "network.sqlite");
    if (!basemap.exists || !network.exists) throw new Error("City map files are missing");
    if (verify) {
      const [basemapHash, networkHash] = await Promise.all([fileSha256(basemap), fileSha256(network)]);
      if (basemapHash !== manifest.sha256.basemap || networkHash !== manifest.sha256.network) {
        throw new Error("City map checksum mismatch");
      }
    }
    return { manifest, basemapUri: basemap.uri, networkUri: network.uri };
  }

  private packageDirectory(id: string, version: string) {
    return new Directory(this.cities, id, version);
  }

  private ensureRoots() {
    this.cities.create({ intermediates: true, idempotent: true });
  }

  private makeStage() {
    const stage = new Directory(Paths.cache, `city-map-stage-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    stage.create({ intermediates: true });
    return stage;
  }
}

async function fileSha256(file: File) {
  const result = await digest(CryptoDigestAlgorithm.SHA256, await file.bytes());
  return [...new Uint8Array(result)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

const nativePath = (uri: string) => decodeURIComponent(uri.replace(/^file:\/\//, ""));
