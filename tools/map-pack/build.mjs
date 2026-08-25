import { rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cities, pack } from "./config.mjs";
import { download, ensureDirectories, requireCommand, run, sha256 } from "./lib.mjs";

const root = resolve(import.meta.dirname, "../..");
const cache = resolve(import.meta.dirname, "cache");
const work = resolve(import.meta.dirname, "work");
const output = resolve(root, "assets/regions/ann-arbor-ypsilanti");
ensureDirectories(cache, work, output);
["curl", "osmium", "pmtiles"].forEach(requireCommand);

const source = resolve(cache, pack.osm.snapshot);
const extract = resolve(work, "region.osm.pbf");
const boundaries = resolve(work, "boundaries.geojsonseq");
const roads = resolve(work, "roads.geojsonseq");
const network = resolve(output, "network.sqlite");
const basemap = resolve(output, "basemap.pmtiles");

await download(pack.osm.url, source, pack.osm.md5);
run("osmium", ["extract", "--overwrite", "--bbox", pack.bbox, "--strategy", "complete_ways", source, "-o", extract]);
run("osmium", ["getid", "--overwrite", "--add-referenced", source, ...cities.map((city) => `r${city.relationId}`), "-o", resolve(work, "boundaries.osm.pbf")]);
run("osmium", ["export", "--overwrite", "--add-unique-id", "type_id", resolve(work, "boundaries.osm.pbf"), "-o", boundaries]);
run("osmium", ["tags-filter", "--overwrite", extract, "w/highway", "-o", resolve(work, "roads.osm.pbf")]);
run("osmium", ["export", "--overwrite", "--add-unique-id", "type_id", resolve(work, "roads.osm.pbf"), "-o", roads]);
run("node", [resolve(import.meta.dirname, "build-network.mjs"), boundaries, roads, network]);
rmSync(basemap, { force: true });
run("pmtiles", [
  "extract",
  pack.basemap.url,
  basemap,
  `--bbox=${pack.bbox}`,
  `--maxzoom=${pack.basemap.maxZoom}`,
]);

const manifest = {
  id: pack.id,
  version: pack.version,
  createdAt: pack.createdAt,
  sha256: { basemap: await sha256(basemap), network: await sha256(network) },
  source: { name: "Geofabrik Michigan / Protomaps Basemap", snapshot: pack.osm.snapshot, url: pack.osm.url },
  license: {
    data: "ODbL-1.0",
    attribution: "© OpenStreetMap contributors",
    url: "https://www.openstreetmap.org/copyright",
  },
  cities,
};
writeFileSync(resolve(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(
  resolve(output, "LICENSE.txt"),
  "Map data © OpenStreetMap contributors, available under ODbL 1.0.\nBasemap produced with Protomaps.\nhttps://www.openstreetmap.org/copyright\n",
);
console.log(`Built ${output}`);
