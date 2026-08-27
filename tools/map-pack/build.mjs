import { rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { cities, cityPackVersion, pack } from "./config.mjs";
import { download, ensureDirectories, requireCommand, run, sha256 } from "./lib.mjs";

const root = resolve(import.meta.dirname, "../..");
const cache = resolve(import.meta.dirname, "cache");
const work = resolve(import.meta.dirname, "work");
const outputRoot = resolve(root, "map-packs/cities");
ensureDirectories(cache, work, outputRoot);
["curl", "osmium", "pmtiles", "zip"].forEach(requireCommand);

const source = resolve(cache, pack.osm.snapshot);
await download(pack.osm.url, source, pack.osm.md5);

for (const city of cities) {
  const cityWork = resolve(work, city.id);
  const output = resolve(outputRoot, city.id);
  ensureDirectories(cityWork, output);
  const extract = resolve(cityWork, "region.osm.pbf");
  const boundaryPbf = resolve(cityWork, "boundary.osm.pbf");
  const boundaries = resolve(cityWork, "boundaries.geojsonseq");
  const roadsPbf = resolve(cityWork, "roads.osm.pbf");
  const roads = resolve(cityWork, "roads.geojsonseq");
  const network = resolve(output, "network.sqlite");
  const basemap = resolve(output, "basemap.pmtiles");
  run("osmium", ["extract", "--overwrite", "--bbox", city.bbox, "--strategy", "complete_ways", source, "-o", extract]);
  run("osmium", ["getid", "--overwrite", "--add-referenced", source, `r${city.relationId}`, "-o", boundaryPbf]);
  run("osmium", ["export", "--overwrite", "--add-unique-id", "type_id", boundaryPbf, "-o", boundaries]);
  run("osmium", ["tags-filter", "--overwrite", extract, "w/highway", "-o", roadsPbf]);
  run("osmium", ["export", "--overwrite", "--add-unique-id", "type_id", roadsPbf, "-o", roads]);
  run("node", [resolve(import.meta.dirname, "build-network.mjs"), boundaries, roads, network, city.id]);
  rmSync(basemap, { force: true });
  run("pmtiles", ["extract", pack.basemap.url, basemap, `--bbox=${city.bbox}`, `--maxzoom=${pack.basemap.maxZoom}`]);
  const manifest = {
    formatVersion: 1,
    id: city.id,
    displayName: city.name,
    version: cityPackVersion,
    createdAt: pack.createdAt,
    bounds: city.bbox.split(",").map(Number),
    sha256: { basemap: await sha256(basemap), network: await sha256(network) },
    source: { name: "Geofabrik Michigan / Protomaps Basemap", snapshot: pack.osm.snapshot, url: pack.osm.url },
    license: {
      data: "ODbL-1.0",
      attribution: "© OpenStreetMap contributors",
      url: "https://www.openstreetmap.org/copyright",
    },
    city: { id: city.id, name: city.name, relationId: city.relationId },
  };
  writeFileSync(resolve(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(
    resolve(output, "LICENSE.txt"),
    "Map data © OpenStreetMap contributors, available under ODbL 1.0.\nBasemap produced with Protomaps.\nhttps://www.openstreetmap.org/copyright\n",
  );
}
run("node", [resolve(import.meta.dirname, "package-release.mjs")]);
