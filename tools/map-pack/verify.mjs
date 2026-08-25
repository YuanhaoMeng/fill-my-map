import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import { cities, landmarks, pack } from "./config.mjs";
import { sha256 } from "./lib.mjs";

const root = resolve(import.meta.dirname, "../..");
const directory = resolve(root, "assets/regions/ann-arbor-ypsilanti");
const paths = {
  manifest: resolve(directory, "manifest.json"),
  network: resolve(directory, "network.sqlite"),
  basemap: resolve(directory, "basemap.pmtiles"),
  license: resolve(directory, "LICENSE.txt"),
};
Object.values(paths).forEach((path) => {
  if (!existsSync(path)) throw new Error(`Missing map-pack artifact: ${path}`);
});

const manifest = JSON.parse(readFileSync(paths.manifest, "utf8"));
if (manifest.version !== pack.version) throw new Error("Unexpected map-pack version");
if ((await sha256(paths.network)) !== manifest.sha256.network) throw new Error("network.sqlite hash mismatch");
if ((await sha256(paths.basemap)) !== manifest.sha256.basemap) throw new Error("basemap.pmtiles hash mismatch");
if (manifest.license?.data !== "ODbL-1.0") throw new Error("Missing ODbL metadata");
if (manifest.license?.attribution !== "© OpenStreetMap contributors") throw new Error("Missing attribution");

const tileMetadata = JSON.parse(execFileSync("pmtiles", ["show", paths.basemap, "--metadata"], { encoding: "utf8" }));
const tileHeader = JSON.parse(execFileSync("pmtiles", ["show", paths.basemap, "--header-json"], { encoding: "utf8" }));
const layers = new Set(tileMetadata.vector_layers?.map((layer) => layer.id));
if (!layers.has("roads") || !layers.has("boundaries")) throw new Error("Basemap lacks roads or boundaries");
if (tileMetadata.attribution?.includes("OpenStreetMap") !== true) throw new Error("Basemap lacks OSM attribution");
if (tileHeader.maxzoom !== pack.basemap.maxZoom) throw new Error("Unexpected basemap maximum zoom");
if (tileHeader.bounds.join(",") !== pack.bbox.split(",").map(Number).join(",")) throw new Error("Unexpected basemap bounds");

const db = new DatabaseSync(paths.network, { readOnly: true });
for (const city of cities) {
  const row = db.prepare("SELECT relation_id, geometry_json FROM cities WHERE id = ?").get(city.id);
  if (row?.relation_id !== city.relationId) throw new Error(`Missing city ${city.name}`);
  const geometry = JSON.parse(row.geometry_json);
  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") throw new Error(`Invalid ${city.name} boundary`);
  for (const mode of ["walk", "drive"]) {
    const count = db.prepare(`SELECT count(*) count FROM edges WHERE city_id = ? AND ${mode} = 1`).get(city.id).count;
    if (count <= 0) throw new Error(`${city.name} has no ${mode} network`);
  }
}
const landmarkRows = db.prepare("SELECT id, osm_ref FROM landmarks ORDER BY id").all();
if (landmarkRows.length !== landmarks.length || new Set(landmarkRows.map((row) => row.id)).size !== 10) {
  throw new Error("Map pack must contain ten unique landmarks");
}
const edgeCount = db.prepare("SELECT count(*) count FROM edges").get().count;
const sampleCount = db.prepare("SELECT count(*) count FROM samples").get().count;
if (edgeCount !== 5_502 || sampleCount !== 81_930) throw new Error("Unexpected road or coverage sample count");
db.close();
console.log(`Map-pack verification passed: ${cities.length} cities, ${landmarkRows.length} landmarks, ${edgeCount} roads, ${sampleCount} samples.`);
