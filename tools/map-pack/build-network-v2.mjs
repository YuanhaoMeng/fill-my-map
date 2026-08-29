import { readFileSync, rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { packages, packVersion } from "./config-v2.mjs";
import { contains, midpoint, samplesAlong } from "./geometry.mjs";
import { parseSequence } from "./lib.mjs";
import { eligibleForProfile } from "./profile-rules.mjs";
import { schema } from "./schema.mjs";
import { nearestDnrTrailName, prepareDnrTrails } from "./trail-names.mjs";

const [boundaryPath, roadPath, parkPath, outputPath, packageId, dnrPath] = process.argv.slice(2);
const selected = packages.find((item) => item.id === packageId);
if (!boundaryPath || !roadPath || !parkPath || !outputPath || !selected) {
  throw new Error("Usage: build-network-v2 boundary roads parks output package-id [dnr]");
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
const dnrData = dnrPath ? JSON.parse(readFileSync(dnrPath, "utf8")) : null;
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
if (selected.kind === "overview") insertPlaces(db, parkPath, boundaryFeature.geometry);
db.exec("VACUUM");
db.close();

function insertPlaces(database, path, boundary) {
  const insert = database.prepare("INSERT OR IGNORE INTO places VALUES (?, ?, ?, ?, ?, ?)");
  for (const feature of parseSequence(path)) {
    if (!parkTags(feature.properties ?? {}) || !feature.geometry) continue;
    const center = geometryCenter(feature.geometry);
    if (!center || !contains(boundary, center)) continue;
    const osmRef = normalizedRef(feature.id);
    insert.run(feature.id, feature.properties?.name ?? "Unnamed park", center[0], center[1], osmRef, detailPack(osmRef));
  }
}

function parkTags(tags) {
  return tags.leisure === "park" || tags.leisure === "nature_reserve" ||
    tags.boundary === "national_park" || tags.boundary === "protected_area";
}
function detailPack(ref) {
  return ref === "relation/5664016" ? "pinckney-state-recreation-area" :
    ref === "way/192787288" ? "county-farm-park" : null;
}
function normalizedRef(id) {
  if (id === "a11328033") return "relation/5664016";
  if (id === "a192787288") return "way/192787288";
  return id.startsWith("r") ? `relation/${id.slice(1)}` : id.startsWith("w") ? `way/${id.slice(1)}` : `node/${id.slice(1)}`;
}
function osmNumber(ref) {
  return ref.startsWith("circle/") ? 0 : Number(ref.split("/")[1]);
}

function geometryCenter(geometry) {
  if (geometry.type === "Point") return geometry.coordinates;
  const coordinates = JSON.stringify(geometry.coordinates).match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const longitude = coordinates.filter((_, index) => index % 2 === 0);
  const latitude = coordinates.filter((_, index) => index % 2 === 1);
  return longitude.length ? [(Math.min(...longitude) + Math.max(...longitude)) / 2, (Math.min(...latitude) + Math.max(...latitude)) / 2] : null;
}

function dnrNames(data) {
  const names = data.layers.flatMap((layer) => layer.features).flatMap(({ properties }) =>
    [properties.TrailNamePrimary, properties.HikingName, properties.TrailNetwork].filter(Boolean));
  return [...new Set(names)].sort();
}
