import { rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { basemap, createdAt, dnrParkSource, dnrSource, osmSources, packages, packVersion } from "./config-v2.mjs";
import { resolveDnrPark } from "./dnr-park-area.mjs";
import { download, ensureDirectories, requireCommand, run, sha256 } from "./lib.mjs";

const root = resolve(import.meta.dirname, "../..");
const cache = resolve(import.meta.dirname, "cache");
const workRoot = resolve(import.meta.dirname, "work-v2");
const outputRoot = resolve(root, "map-packs/cities");
ensureDirectories(cache, workRoot, outputRoot);
["curl", "osmium", "pmtiles", "zip"].forEach(requireCommand);
for (const source of osmSources) {
  await download(source.url, resolve(cache, source.snapshot), source.md5);
}
const dnrPath = resolve(cache, dnrSource.snapshot);
run("node", [resolve(import.meta.dirname, "fetch-dnr.mjs"), dnrPath]);
const dnrParksPath = resolve(cache, dnrParkSource.snapshot);
run("node", [resolve(import.meta.dirname, "fetch-dnr-parks.mjs"), dnrParksPath]);

for (const configured of packages) {
  const item = resolveDnrPark(configured, dnrParksPath);
  const work = resolve(workRoot, item.id);
  const output = resolve(outputRoot, item.id);
  rmSync(work, { recursive: true, force: true });
  ensureDirectories(work, output);
  const source = item.kind === "overview" ? null : prepareSource(item, work);
  const boundary = resolve(work, "boundary.geojsonseq");
  const roads = resolve(work, "roads.geojsonseq");
  const parks = resolve(work, "parks.geojsonseq");
  prepareBoundary(item, boundary);
  if (source) exportFiltered(source, roads, roadFilter(item.profile), resolve(work, "roads.osm.pbf"));
  else writeFileSync(roads, "");
  writeFileSync(parks, "");
  const network = resolve(output, "network.sqlite");
  const args = [boundary, roads, parks, network, item.id];
  args.push(item.officialSource ? dnrPath : "-", item.kind === "overview" ? dnrParksPath : "-");
  run("node", [resolve(import.meta.dirname, "build-network-v2.mjs"), ...args]);
  const basemapPath = resolve(output, "basemap.pmtiles");
  rmSync(basemapPath, { force: true });
  run("pmtiles", ["extract", basemap.url, basemapPath, `--bbox=${item.tileBbox ?? item.bbox}`, `--maxzoom=${item.maxZoom ?? basemap.maxZoom}`]);
  await writePackageFiles(item, output, network, basemapPath);
}
run("node", [resolve(import.meta.dirname, "package-release-v2.mjs")]);

function prepareSource(item, work) {
  const extracts = item.sourceIds.map((id) => {
    const configured = osmSources.find((source) => source.id === id);
    if (!configured) throw new Error(`Unknown source ${id}`);
    const output = resolve(work, `${id}.osm.pbf`);
    run("osmium", ["extract", "--overwrite", "--bbox", item.bbox, "--strategy", "complete_ways",
      resolve(cache, configured.snapshot), "-o", output]);
    return output;
  });
  if (extracts.length === 1) return extracts[0];
  const merged = resolve(work, "merged.osm.pbf");
  run("osmium", ["merge", "--overwrite", ...extracts, "-o", merged]);
  return merged;
}

function prepareBoundary(item, output) {
  if (item.kind === "overview") {
    run("node", [resolve(import.meta.dirname, "make-circle.mjs"), output, item.id, item.name,
      String(item.center[0]), String(item.center[1]), String(item.radiusMiles)]);
    return;
  }
  if (item.dnrGeometry) {
    writeFileSync(output, `${JSON.stringify({
      type: "Feature", id: item.osmRef, properties: { name: item.name }, geometry: item.dnrGeometry,
    })}\n`);
    return;
  }
  const source = osmSources.find((candidate) => candidate.id === item.sourceIds[0]);
  const pbf = resolve(import.meta.dirname, "cache", source.snapshot);
  const object = item.osmRef.replace("relation/", "r").replace("way/", "w");
  const boundaryPbf = output.replace(".geojsonseq", ".osm.pbf");
  run("osmium", ["getid", "--overwrite", "--add-referenced", pbf, object, "-o", boundaryPbf]);
  run("osmium", ["export", "--overwrite", "--add-unique-id", "type_id", boundaryPbf, "-o", output]);
}

function exportFiltered(source, output, filters, pbf) {
  run("osmium", ["tags-filter", "--overwrite", source, ...filters, "-o", pbf]);
  run("osmium", ["export", "--overwrite", "--add-unique-id", "type_id", pbf, "-o", output]);
}

function roadFilter(profile) {
  return profile === "arterial"
    ? ["w/highway=motorway,trunk,primary,secondary,motorway_link,trunk_link,primary_link,secondary_link"]
    : ["w/highway=path,footway,track,bridleway,cycleway,steps,pedestrian"];
}

async function writePackageFiles(item, output, network, basemapPath) {
  const selectedSources = osmSources.filter((source) => item.sourceIds.includes(source.id)).map((source) => ({
    name: `Geofabrik ${source.id}`, snapshot: source.snapshot, url: source.url, license: "ODbL-1.0",
  }));
  if (item.officialSource) selectedSources.push({
    name: dnrSource.name, snapshot: dnrSource.snapshot, url: dnrSource.url, license: "Michigan public record",
  });
  if (item.kind === "overview" || item.dnrGeometry) selectedSources.push({
    name: dnrParkSource.name, snapshot: dnrParkSource.snapshot, url: dnrParkSource.url, license: "Michigan public record",
  });
  selectedSources.push({
    name: "Protomaps Basemap", snapshot: "20260811", url: basemap.url, license: "ODbL-1.0",
  });
  const manifest = {
    formatVersion: 2, id: item.id, displayName: item.name, version: packVersion, createdAt,
    kind: item.kind, parentId: item.parentId, networkProfile: item.profile,
    bounds: item.bbox.split(",").map(Number),
    area: { id: item.id, name: item.name, osmRef: item.osmRef, center: item.center, radiusMiles: item.radiusMiles },
    sha256: { basemap: await sha256(basemapPath), network: await sha256(network) }, sources: selectedSources,
    license: { data: "ODbL-1.0", attribution: "© OpenStreetMap contributors", url: "https://www.openstreetmap.org/copyright" },
  };
  writeFileSync(resolve(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(resolve(output, "LICENSE.txt"),
    "Map data © OpenStreetMap contributors, ODbL 1.0.\nMichigan DNR public-record data supplies park boundaries and route validation.\n");
}
