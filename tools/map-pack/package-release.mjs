import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cities, cityPackVersion, releaseBaseUrl } from "./config.mjs";
import { sha256 } from "./lib.mjs";

const root = resolve(import.meta.dirname, "../..");
const release = resolve(root, "map-packs/releases");
mkdirSync(release, { recursive: true });
const entries = [];

for (const city of cities) {
  const source = resolve(root, "map-packs/cities", city.id);
  const name = `${city.id}-${cityPackVersion}.fillmap`;
  const archive = resolve(release, name);
  rmSync(archive, { force: true });
  execFileSync("zip", ["-X", "-9", archive, "manifest.json", "basemap.pmtiles", "network.sqlite", "LICENSE.txt"], {
    cwd: source,
    env: { ...process.env, COPYFILE_DISABLE: "1" },
    stdio: "inherit",
  });
  entries.push({
    id: city.id,
    displayName: city.name,
    version: cityPackVersion,
    sizeBytes: fileSize(archive),
    sha256: await sha256(archive),
    downloadUrl: `${releaseBaseUrl}/${name}`,
  });
}
const catalog = { formatVersion: 1, cities: entries };
writeFileSync(resolve(root, "docs/maps/catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`);

function fileSize(path) {
  return Number(execFileSync("stat", ["-f", "%z", path], { encoding: "utf8" }).trim());
}
