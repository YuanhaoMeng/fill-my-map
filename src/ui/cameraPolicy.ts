import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { Coordinate } from "../core/types";

export function isInsideBoundary(
  coordinate: Coordinate,
  boundaries: FeatureCollection<Polygon | MultiPolygon>,
) {
  return boundaries.features.some(({ geometry }) => geometry.type === "Polygon"
    ? insidePolygon(coordinate, geometry.coordinates)
    : geometry.coordinates.some((polygon) => insidePolygon(coordinate, polygon)));
}

export function shouldAutoFollow(
  hasSession: boolean,
  coordinate: Coordinate | undefined,
  boundaries: FeatureCollection<Polygon | MultiPolygon>,
) {
  return Boolean(hasSession && coordinate && isInsideBoundary(coordinate, boundaries));
}

export function userViewportBounds(
  [longitude, latitude]: Coordinate,
  radiusMiles = 50,
): [number, number, number, number] {
  const latitudeDelta = radiusMiles / 69;
  const longitudeDelta = radiusMiles / (69 * Math.cos((latitude * Math.PI) / 180));
  return [longitude - longitudeDelta, latitude - latitudeDelta, longitude + longitudeDelta, latitude + latitudeDelta];
}

function insidePolygon(point: Coordinate, rings: number[][][]) {
  return Boolean(rings[0] && insideRing(point, rings[0])) &&
    !rings.slice(1).some((ring) => insideRing(point, ring));
}

function insideRing([x, y]: Coordinate, ring: number[][]) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const current = ring[index]!;
    const prior = ring[previous]!;
    const xi = current[0]!;
    const yi = current[1]!;
    const xj = prior[0]!;
    const yj = prior[1]!;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
