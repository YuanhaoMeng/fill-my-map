import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";
import { cities, cityPackVersion } from "./config.mjs";
import { sha256 } from "./lib.mjs";

const root = resolve(import.meta.dirname, "../..");
const catalog = JSON.parse(readFileSync(resolve(root, "docs/maps/catalog.json"), "utf8"));
if (catalog.formatVersion !== 1 || catalog.cities.length !== cities.length) throw new Error("Unexpected city catalog");

let totalEdges = 0;
let totalSamples = 0;
let totalLandmarks = 0;
for (const city of cities) {
  const directory = resolve(root, "map-packs/cities", city.id);
  const paths = Object.fromEntries(
    ["manifest.json", "network.sqlite", "basemap.pmtiles", "LICENSE.txt"]
      .map((name) => [name, resolve(directory, name)]),
  );
  Object.values(paths).forEach((path) => {
    if (!existsSync(path)) throw new Error(`Missing city-pack artifact: ${path}`);
  });
  const manifest = JSON.parse(readFileSync(paths["manifest.json"], "utf8"));
  await validateManifest(manifest, city, paths);
  validateTiles(paths["basemap.pmtiles"], city.bbox);
  const counts = validateNetwork(paths["network.sqlite"], city);
  totalEdges += counts.edges;
  totalSamples += counts.samples;
  totalLandmarks += counts.landmarks;
  const entry = catalog.cities.find((item) => item.id === city.id);
  if (entry?.version !== cityPackVersion) {
    throw new Error(`Catalog mismatch for ${city.name}`);
  }
  await validateArchive(city, entry);
}
console.log(
  `Map-pack verification passed: ${cities.length} cities, ${totalLandmarks} landmarks, ` +
  `${totalEdges} roads, ${totalSamples} samples.`,
);

async function validateManifest(manifest, city, paths) {
  if (manifest.formatVersion !== 1 || manifest.id !== city.id || manifest.version !== cityPackVersion) {
    throw new Error(`Unexpected manifest for ${city.name}`);
  }
  if ((await sha256(paths["network.sqlite"])) !== manifest.sha256.network) {
    throw new Error(`${city.name} network hash mismatch`);
  }
  if ((await sha256(paths["basemap.pmtiles"])) !== manifest.sha256.basemap) {
    throw new Error(`${city.name} basemap hash mismatch`);
  }
  if (manifest.license?.data !== "ODbL-1.0" || manifest.license?.attribution !== "© OpenStreetMap contributors") {
    throw new Error(`Missing license metadata for ${city.name}`);
  }
}

function validateTiles(path, bbox) {
  const metadata = JSON.parse(execFileSync("pmtiles", ["show", path, "--metadata"], { encoding: "utf8" }));
  const header = JSON.parse(execFileSync("pmtiles", ["show", path, "--header-json"], { encoding: "utf8" }));
  const layers = new Set(metadata.vector_layers?.map((layer) => layer.id));
  if (!layers.has("roads") || !layers.has("boundaries")) throw new Error("Basemap lacks required layers");
  if (!metadata.attribution?.includes("OpenStreetMap")) throw new Error("Basemap lacks OSM attribution");
  if (header.maxzoom !== 15 || header.bounds.join(",") !== bbox) throw new Error("Unexpected basemap bounds");
}

function validateNetwork(path, city) {
  const db = new DatabaseSync(path, { readOnly: true });
  const found = db.prepare("SELECT relation_id FROM cities WHERE id=?").get(city.id);
  if (found?.relation_id !== city.relationId) throw new Error(`Missing boundary for ${city.name}`);
  const edges = Number(db.prepare("SELECT count(*) count FROM edges").get().count);
  const samples = Number(db.prepare("SELECT count(*) count FROM samples").get().count);
  const landmarks = Number(db.prepare("SELECT count(*) count FROM landmarks").get().count);
  db.close();
  if (edges !== city.expected.edges || samples !== city.expected.samples || landmarks !== city.expected.landmarks) {
    throw new Error(`Unexpected network counts for ${city.name}`);
  }
  return { edges, samples, landmarks };
}

function fileSize(path) {
  return Number(execFileSync("stat", ["-f", "%z", path], { encoding: "utf8" }).trim());
}

async function validateArchive(city, entry) {
  const archive = resolve(root, "map-packs/releases", `${city.id}-${cityPackVersion}.fillmap`);
  if (!existsSync(archive) || entry.sizeBytes !== fileSize(archive) || entry.sha256 !== await sha256(archive)) {
    throw new Error(`Release archive mismatch for ${city.name}`);
  }
  const names = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" }).trim().split("\n").sort();
  if (names.join(",") !== ["LICENSE.txt", "basemap.pmtiles", "manifest.json", "network.sqlite"].join(",")) {
    throw new Error(`Unexpected release archive contents for ${city.name}`);
  }
}
