import { writeFileSync } from "node:fs";
import { dnrParkSource, packages } from "./config-v2.mjs";

const output = process.argv[2];
if (!output) throw new Error("Usage: fetch-dnr-parks output");
const overview = packages.find((item) => item.kind === "overview");
if (!overview) throw new Error("Missing overview configuration");
const query = new URL(`${dnrParkSource.url}/query`);
query.search = new URLSearchParams({
  f: "geojson", where: "Division='Parks'", outFields: "ProjectID,UnitName,Division",
  returnGeometry: "true", geometry: overview.center.join(","), geometryType: "esriGeometryPoint",
  inSR: "4326", outSR: "4326", distance: String(overview.radiusMiles),
  units: "esriSRUnit_StatuteMile", spatialRel: "esriSpatialRelIntersects",
}).toString();
const response = await fetch(query);
if (!response.ok) throw new Error(`DNR park query failed: ${response.status}`);
const data = await response.json();
if (data.error || !Array.isArray(data.features)) throw new Error("Invalid DNR park response");
writeFileSync(output, `${JSON.stringify({ ...data, fetchedAt: new Date().toISOString(), source: dnrParkSource.url }, null, 2)}\n`);
