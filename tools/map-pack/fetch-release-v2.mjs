import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const catalog = JSON.parse(readFileSync(resolve(root, "docs/maps/catalog.json"), "utf8"));
if (catalog.formatVersion !== 2) throw new Error("Expected v2 map catalog");
for (const entry of catalog.packages) {
  const directory = resolve(root, "map-packs/cities", entry.id);
  const archive = resolve(root, "map-packs/releases", `${entry.id}-${entry.version}.fillmap`);
  if (complete(directory) && existsSync(archive)) continue;
  mkdirSync(resolve(root, "map-packs/releases"), { recursive: true });
  execFileSync("curl", ["--fail", "--location", "--output", archive, entry.downloadUrl], { stdio: "inherit" });
  if (await sha256(archive) !== entry.sha256) throw new Error(`Checksum mismatch for ${entry.id}`);
  const names = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" }).trim().split("\n").sort();
  const allowed = ["LICENSE.txt", "basemap.pmtiles", "manifest.json", "network.sqlite"];
  if (names.join(",") !== allowed.join(",")) throw new Error(`Unsafe archive for ${entry.id}`);
  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory, { recursive: true });
  execFileSync("unzip", ["-q", archive, "-d", directory]);
}

function complete(directory) {
  return ["manifest.json", "network.sqlite", "basemap.pmtiles", "LICENSE.txt"]
    .every((name) => existsSync(resolve(directory, name)));
}

async function sha256(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
