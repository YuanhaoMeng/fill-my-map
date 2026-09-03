import { readFileSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { packages, packVersion } from "./config-v2.mjs";
import { contains, midpoint, samplesAlong } from "./geometry.mjs";
import { parseSequence } from "./lib.mjs";
import { eligibleForProfile } from "./profile-rules.mjs";
import { schema } from "./schema.mjs";
import { nearestDnrTrailName, prepareDnrTrails } from "./trail-names.mjs";

const [boundaryPath, roadPath, , outputPath, packageId, dnrPath, dnrParksPath] = process.argv.slice(2);
const selected = packages.find((item) => item.id === packageId);
if (!boundaryPath || !roadPath || !outputPath || !selected) {
  throw new Error("Usage: build-network-v2 boundary roads parks output package-id [dnr] [dnr-parks]");
}
const boundaryFeature = parseSequence(boundaryPath).find((item) =>
  item.geometry?.type === "Polygon" || item.geometry?.type === "MultiPolygon");
if (!boundaryFeature?.geometry) throw new Error(`Missing boundary for ${selected.name}`);

rmSync(outputPath, { force: true });
const db = new DatabaseSync(outputPath);
db.exec(schema);
db.prepare("INSERT INTO cities VALUES (?, ?, ?, ?)").run(
  selected.id, selected.name, osmNumber(selected.osmRef), JSON.stringify(boundaryFeature.geometry),
);
const metadata = db.prepare("INSERT INTO metadata VALUES (?, ?)");
metadata.run("region_version", packVersion);
metadata.run("attribution", "© OpenStreetMap contributors");
metadata.run("pack_kind", selected.kind);
metadata.run("network_profile", selected.profile);
const dnrData = dnrPath && dnrPath !== "-" ? JSON.parse(readFileSync(dnrPath, "utf8")) : null;
const dnrTrails = dnrData ? prepareDnrTrails(dnrData) : [];
if (dnrData) metadata.run("dnr_trail_names", JSON.stringify(dnrNames(dnrData)));

const insertEdge = db.prepare("INSERT INTO edges VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
const insertSample = db.prepare("INSERT INTO samples VALUES (?, ?, ?, ?, ?)");
const insertSpatial = db.prepare("INSERT INTO sample_index VALUES (?, ?, ?, ?, ?)");
let sampleId = 0;
let dnrNamedEdges = 0;
db.exec("BEGIN");
for (const feature of parseSequence(roadPath)) {
  if (!eligibleForProfile(feature.properties ?? {}, selected.profile)) continue;
  const geometry = feature.geometry;
  if (geometry?.type !== "LineString" && geometry?.type !== "MultiLineString") continue;
  const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
  lines.forEach((line, part) => {
    if (line.length < 2 || !contains(boundaryFeature.geometry, midpoint(line))) return;
    const id = `${feature.id}:${part}`;
    const samples = samplesAlong(line);
    const longitude = line.map((coordinate) => coordinate[0]);
    const latitude = line.map((coordinate) => coordinate[1]);
    const officialName = nearestDnrTrailName(line, dnrTrails);
    if (officialName) dnrNamedEdges += 1;
    insertEdge.run(
      id, selected.id, feature.id, officialName ?? feature.properties?.name ?? feature.properties?.ref ?? null,
      1, 1, samples.length, JSON.stringify(line), Math.min(...longitude), Math.max(...longitude),
      Math.min(...latitude), Math.max(...latitude),
    );
    samples.forEach((sample) => {
      sampleId += 1;
      const [lon, lat] = sample.coordinate;
      insertSample.run(sampleId, id, lon, lat, sample.bearing);
      insertSpatial.run(sampleId, lon, lon, lat, lat);
    });
  });
}
db.exec("COMMIT");
if (dnrData) metadata.run("dnr_named_edges", String(dnrNamedEdges));
if (selected.kind === "overview") insertOfficialPlaces(db, dnrParksPath);
db.exec("VACUUM");
db.close();

function insertOfficialPlaces(database, path) {
  if (!path || path === "-") throw new Error("Missing official DNR park inventory");
  const data = JSON.parse(readFileSync(path, "utf8"));
  const grouped = new Map();
  for (const feature of data.features ?? []) {
    const name = feature.properties?.UnitName;
    if (!name || !feature.geometry) continue;
    const projectId = String(feature.properties?.ProjectID || slug(name));
    const current = grouped.get(projectId) ?? { name, positions: [] };
    current.positions.push(...positions(feature.geometry.coordinates));
    grouped.set(projectId, current);
  }
  const insert = database.prepare("INSERT OR IGNORE INTO places VALUES (?, ?, ?, ?, ?, ?)");
  for (const [projectId, park] of [...grouped].sort((a, b) => a[1].name.localeCompare(b[1].name))) {
    const center = centerOf(park.positions);
    const detail = packages.find((item) => item.officialProjectId === projectId)?.id ?? null;
    insert.run(`dnr-${projectId}`, park.name, center[0], center[1], `dnr-project/${projectId}`, detail);
  }
}

function positions(value) {
  if (!Array.isArray(value)) return [];
  if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") return [value];
  return value.flatMap(positions);
}

function centerOf(items) {
  const longitude = items.map((item) => item[0]);
  const latitude = items.map((item) => item[1]);
  return [(Math.min(...longitude) + Math.max(...longitude)) / 2, (Math.min(...latitude) + Math.max(...latitude)) / 2];
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function osmNumber(ref) {
  return ref.startsWith("relation/") || ref.startsWith("way/") ? Number(ref.split("/")[1]) : 0;
}

function dnrNames(data) {
  const names = data.layers.flatMap((layer) => layer.features).flatMap(({ properties }) =>
    [properties.TrailNamePrimary, properties.HikingName, properties.TrailNetwork].filter(Boolean));
  return [...new Set(names)].sort();
}
