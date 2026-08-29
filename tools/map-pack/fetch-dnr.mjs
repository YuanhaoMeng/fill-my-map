import { writeFileSync } from "node:fs";
import { dnrSource, packages } from "./config-v2.mjs";

const output = process.argv[2];
if (!output) throw new Error("Usage: fetch-dnr output");
const pinckney = packages.find((item) => item.id === "pinckney-state-recreation-area");
const fields = "OBJECTID,FacilityName,SiteName,TrailNamePrimary,HikingName,TrailNetwork,OpenClosedStatusNonmotor,last_edited_date";
const layers = [];
for (const layerId of [2, 3, 4, 5, 6]) {
  const query = new URL(`${dnrSource.url}/${layerId}/query`);
  query.search = new URLSearchParams({
    f: "geojson", where: "1=1", outFields: fields, returnGeometry: "true",
    geometry: pinckney.bbox, geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
  }).toString();
  const response = await fetch(query);
  if (!response.ok) throw new Error(`DNR layer ${layerId} failed: ${response.status}`);
  const data = await response.json();
  layers.push({ layerId, features: data.features ?? [] });
}
writeFileSync(output, `${JSON.stringify({ fetchedAt: new Date().toISOString(), source: dnrSource.url, layers }, null, 2)}\n`);
