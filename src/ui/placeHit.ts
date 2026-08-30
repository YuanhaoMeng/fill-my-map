import type { Feature } from "geojson";

export type PlaceHit = { id: string | null; name: string };

export function placeHit(features: readonly Feature[]): PlaceHit | null {
  const named = features.filter((feature) => typeof feature.properties?.name === "string");
  const feature = named.find((item) => item.properties?.detailPackId) ?? named[0];
  if (!feature?.properties) return null;
  return {
    id: feature.properties.detailPackId ? String(feature.properties.detailPackId) : null,
    name: String(feature.properties.name),
  };
}

export function placeHitBounds(point: readonly [number, number], radius = 18): [[number, number], [number, number]] {
  return [
    [point[0] - radius, point[1] - radius],
    [point[0] + radius, point[1] + radius],
  ];
}
