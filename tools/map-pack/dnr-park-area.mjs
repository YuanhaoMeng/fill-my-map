import { readFileSync } from "node:fs";

export function resolveDnrPark(item, sourcePath) {
  if (item.kind !== "place" || item.bbox) return item;
  const data = JSON.parse(readFileSync(sourcePath, "utf8"));
  const features = (data.features ?? []).filter((feature) =>
    projectId(feature) === item.officialProjectId && feature.geometry);
  if (!features.length) throw new Error(`Missing DNR boundary for ${item.name}`);
  const polygons = features.flatMap(({ geometry }) => geometry.type === "Polygon"
    ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : []);
  const points = polygons.flat(2);
  const longitude = points.map((point) => point[0]);
  const latitude = points.map((point) => point[1]);
  const margin = 0.01;
  const bounds = [
    Math.min(...longitude) - margin, Math.min(...latitude) - margin,
    Math.max(...longitude) + margin, Math.max(...latitude) + margin,
  ];
  return {
    ...item,
    center: [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2],
    bbox: bounds.join(","),
    dnrGeometry: { type: "MultiPolygon", coordinates: polygons },
  };
}

function projectId(feature) {
  const value = feature.properties?.ProjectID;
  return String(value || slug(feature.properties?.UnitName ?? ""));
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
