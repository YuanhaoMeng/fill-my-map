import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { resolve } from "node:path";
import { packages, packVersion } from "./config-v2.mjs";
import { sha256 } from "./lib.mjs";

const root = resolve(import.meta.dirname, "../..");
const catalog = JSON.parse(readFileSync(resolve(root, "docs/maps/catalog.json"), "utf8"));
if (catalog.formatVersion !== 2 || catalog.packages.length !== packages.length) {
  throw new Error("Unexpected v2 map catalog");
}
let totalEdges = 0;
let totalSamples = 0;
let totalPlaces = 0;
for (const item of packages) {
  const directory = resolve(root, "map-packs/cities", item.id);
  const paths = Object.fromEntries(["manifest.json", "network.sqlite", "basemap.pmtiles", "LICENSE.txt"]
    .map((name) => [name, resolve(directory, name)]));
  Object.values(paths).forEach((path) => {
    if (!existsSync(path)) throw new Error(`Missing map-pack artifact: ${path}`);
  });
  const manifest = JSON.parse(readFileSync(paths["manifest.json"], "utf8"));
  await validateManifest(manifest, item, paths);
  validateTiles(paths["basemap.pmtiles"], item.tileBbox ?? item.bbox, item.maxZoom ?? 15);
  const counts = validateNetwork(paths["network.sqlite"], item);
  totalEdges += counts.edges;
  totalSamples += counts.samples;
  totalPlaces += counts.places;
  const entry = catalog.packages.find((candidate) => candidate.id === item.id);
  if (entry?.version !== packVersion || entry.kind !== item.kind || entry.networkProfile !== item.profile) {
    throw new Error(`Catalog mismatch for ${item.name}`);
  }
  await validateArchive(item, entry);
}
console.log(
  `Map-pack verification passed: ${packages.length} packages, ${totalPlaces} parks, ` +
  `${totalEdges} network segments, ${totalSamples} samples.`,
);

async function validateManifest(manifest, item, paths) {
  if (manifest.formatVersion !== 2 || manifest.id !== item.id || manifest.version !== packVersion ||
      manifest.kind !== item.kind || manifest.networkProfile !== item.profile) {
    throw new Error(`Unexpected manifest for ${item.name}`);
  }
  if ((await sha256(paths["network.sqlite"])) !== manifest.sha256.network ||
      (await sha256(paths["basemap.pmtiles"])) !== manifest.sha256.basemap) {
    throw new Error(`${item.name} content hash mismatch`);
  }
  if (manifest.license?.data !== "ODbL-1.0" || manifest.license?.attribution !== "© OpenStreetMap contributors") {
    throw new Error(`Missing license metadata for ${item.name}`);
  }
  if (item.officialSource && !manifest.sources.some((source) => source.name.includes("DNR"))) {
    throw new Error(`${item.name} lacks DNR provenance`);
  }
}

function validateTiles(path, bbox, maxZoom) {
  const metadata = JSON.parse(execFileSync("pmtiles", ["show", path, "--metadata"], { encoding: "utf8" }));
  const header = JSON.parse(execFileSync("pmtiles", ["show", path, "--header-json"], { encoding: "utf8" }));
  const layers = new Set(metadata.vector_layers?.map((layer) => layer.id));
  if (!layers.has("roads") || !layers.has("boundaries")) throw new Error("Basemap lacks required layers");
  if (!metadata.attribution?.includes("OpenStreetMap")) throw new Error("Basemap lacks OSM attribution");
  const expectedBounds = bbox.split(",").map(Number);
  const boundsMatch = header.bounds.every((value, index) => Math.abs(value - expectedBounds[index]) < 0.000001);
  if (header.maxzoom !== maxZoom || !boundsMatch) throw new Error("Unexpected basemap bounds");
}

function validateNetwork(path, item) {
  const db = new DatabaseSync(path, { readOnly: true });
  const metadata = Object.fromEntries(db.prepare("SELECT key, value FROM metadata").all().map((row) => [row.key, row.value]));
  const edges = scalar(db, "edges");
  const samples = scalar(db, "samples");
  const places = scalar(db, "places");
  const validCounts = item.kind === "overview" ? edges === 0 && samples === 0 : edges > 0 && samples > 0;
  if (metadata.pack_kind !== item.kind || metadata.network_profile !== item.profile || !validCounts) {
    throw new Error(`Invalid ${item.name} network profile`);
  }
  if (item.expected && (edges !== item.expected.edges || samples !== item.expected.samples || places !== item.expected.places)) {
    throw new Error(`Unexpected network counts for ${item.name}`);
  }
  if (item.kind === "overview") validateOverviewPlaces(db, places);
  if (item.officialSource) validateDnrNames(db, metadata);
  db.close();
  return { edges, samples, places };
}

function scalar(db, table) {
  return Number(db.prepare(`SELECT count(*) count FROM ${table}`).get().count);
}

function validateOverviewPlaces(db, count) {
  if (count !== 21) throw new Error("Overview park inventory is unexpectedly small");
  const details = db.prepare("SELECT detail_pack_id FROM places WHERE detail_pack_id IS NOT NULL ORDER BY detail_pack_id")
    .all().map((row) => row.detail_pack_id);
  if (details.join(",") !== "pinckney-state-recreation-area") {
    throw new Error("Overview detail park links are incomplete");
  }
}

function validateDnrNames(db, metadata) {
  const names = new Set(JSON.parse(metadata.dnr_trail_names ?? "[]"));
  for (const required of ["Pinckney Crooked Lake Trail", "Pinckney Losee Lake Trail", "Pinckney Potawatomi Trail", "Pinckney Silver Lake Trail"]) {
    if (!names.has(required)) throw new Error(`Missing DNR route: ${required}`);
  }
  if (Number(metadata.dnr_named_edges) < 10) throw new Error("Too few OSM trails matched to DNR names");
  const edgeNames = new Set(db.prepare("SELECT DISTINCT name FROM edges WHERE name IS NOT NULL").all().map((row) => row.name));
  if (!edgeNames.has("Pinckney Potawatomi Trail") || !edgeNames.has("Pinckney Waterloo-Pinckney Trail")) {
    throw new Error("Official DNR route names were not applied to OSM trails");
  }
}

async function validateArchive(item, entry) {
  const archive = resolve(root, "map-packs/releases", `${item.id}-${packVersion}.fillmap`);
  if (!existsSync(archive) || entry.sizeBytes !== fileSize(archive) || entry.sha256 !== await sha256(archive)) {
    throw new Error(`Release archive mismatch for ${item.name}`);
  }
  const names = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" }).trim().split("\n").sort();
  if (names.join(",") !== ["LICENSE.txt", "basemap.pmtiles", "manifest.json", "network.sqlite"].join(",")) {
    throw new Error(`Unexpected archive contents for ${item.name}`);
  }
}

function fileSize(path) {
  return Number(execFileSync("stat", ["-f", "%z", path], { encoding: "utf8" }).trim());
}
