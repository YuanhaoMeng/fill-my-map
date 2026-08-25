import { rmSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { cities, landmarks, pack } from "./config.mjs";
import { contains, midpoint, samplesAlong } from "./geometry.mjs";
import { parseSequence } from "./lib.mjs";
import { eligibleModes } from "./rules.mjs";
import { schema } from "./schema.mjs";

const [boundaryPath, roadPath, outputPath] = process.argv.slice(2);
if (!boundaryPath || !roadPath || !outputPath) throw new Error("Usage: build-network boundaries roads output");
rmSync(outputPath, { force: true });
const db = new DatabaseSync(outputPath);
db.exec(schema);

const boundaryFeatures = parseSequence(boundaryPath);
const boundaries = cities.map((city) => {
  const areaId = `a${city.relationId * 2 + 1}`;
  const feature = boundaryFeatures.find((item) => item.id === areaId || item.id === `r${city.relationId}`);
  if (!feature?.geometry) throw new Error(`Missing boundary relation ${city.relationId}`);
  return { ...city, geometry: feature.geometry };
});

const insertCity = db.prepare("INSERT INTO cities VALUES (?, ?, ?, ?)");
boundaries.forEach((city) => insertCity.run(city.id, city.name, city.relationId, JSON.stringify(city.geometry)));
db.prepare("INSERT INTO metadata VALUES (?, ?)").run("region_version", pack.version);
db.prepare("INSERT INTO metadata VALUES (?, ?)").run("attribution", "© OpenStreetMap contributors");

const insertEdge = db.prepare("INSERT INTO edges VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
const insertSample = db.prepare("INSERT INTO samples VALUES (?, ?, ?, ?, ?)");
const insertSpatial = db.prepare("INSERT INTO sample_index VALUES (?, ?, ?, ?, ?)");
let sampleId = 0;
db.exec("BEGIN");
for (const feature of parseSequence(roadPath)) {
  const modes = eligibleModes(feature.properties ?? {});
  if (!modes.length) continue;
  const geometryType = feature.geometry?.type;
  if (geometryType !== "LineString" && geometryType !== "MultiLineString") continue;
  const lines = geometryType === "LineString" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  if (!Array.isArray(lines)) continue;
  lines.forEach((line, part) => {
    if (line.length < 2) return;
    const city = boundaries.find((candidate) => contains(candidate.geometry, midpoint(line)));
    if (!city) return;
    const id = `${feature.id}:${part}`;
    const samples = samplesAlong(line);
    const longitude = line.map((coordinate) => coordinate[0]);
    const latitude = line.map((coordinate) => coordinate[1]);
    insertEdge.run(
      id,
      city.id,
      feature.id,
      feature.properties?.name ?? null,
      modes.includes("walk") ? 1 : 0,
      modes.includes("drive") ? 1 : 0,
      samples.length,
      JSON.stringify(line),
      Math.min(...longitude),
      Math.max(...longitude),
      Math.min(...latitude),
      Math.max(...latitude),
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

const insertLandmark = db.prepare("INSERT INTO landmarks VALUES (?, ?, ?, ?, ?, ?, ?)");
landmarks.forEach(([id, cityId, name, longitude, latitude, osm]) =>
  insertLandmark.run(id, cityId, name, longitude, latitude, 75, osm),
);
db.exec("VACUUM");
db.close();
