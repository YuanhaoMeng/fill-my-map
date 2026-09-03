import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { packages, packVersion, releaseBaseUrl } from "./config-v2.mjs";
import { sha256 } from "./lib.mjs";

const root = resolve(import.meta.dirname, "../..");
const release = resolve(root, "map-packs/releases");
mkdirSync(release, { recursive: true });
const entries = [];
for (const item of packages) {
  const source = resolve(root, "map-packs/cities", item.id);
  const name = `${item.id}-${packVersion}.fillmap`;
  const archive = resolve(release, name);
  rmSync(archive, { force: true });
  execFileSync("zip", ["-X", "-9", archive, "manifest.json", "basemap.pmtiles", "network.sqlite", "LICENSE.txt"], {
    cwd: source, env: { ...process.env, COPYFILE_DISABLE: "1" }, stdio: "inherit",
  });
  entries.push({
    id: item.id, displayName: item.name, version: packVersion, kind: item.kind,
    parentId: item.parentId, networkProfile: item.profile, sizeBytes: fileSize(archive),
    sha256: await sha256(archive), downloadUrl: `${releaseBaseUrl}/${name}`,
  });
}
const overview = packages.find((item) => item.kind === "overview");
if (!overview) throw new Error("Missing overview package");
const assetDirectory = resolve(root, "assets/maps");
mkdirSync(assetDirectory, { recursive: true });
copyFileSync(
  resolve(release, `${overview.id}-${packVersion}.fillmap`),
  resolve(assetDirectory, "united-states-overview.zip"),
);
writeFileSync(resolve(root, "docs/maps/catalog.json"),
  `${JSON.stringify({ formatVersion: 2, packages: entries })}\n`);

function fileSize(path) {
  return Number(execFileSync("stat", ["-f", "%z", path], { encoding: "utf8" }).trim());
}
