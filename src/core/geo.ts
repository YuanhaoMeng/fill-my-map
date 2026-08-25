import type { Coordinate } from "./types";

const EARTH_RADIUS_M = 6_371_000;

function radians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceM(a: Coordinate, b: Coordinate) {
  const lat1 = radians(a[1]);
  const lat2 = radians(b[1]);
  const dLat = lat2 - lat1;
  const dLon = radians(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function bearingDeg(a: Coordinate, b: Coordinate) {
  const lat1 = radians(a[1]);
  const lat2 = radians(b[1]);
  const dLon = radians(b[0] - a[0]);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function undirectedHeadingDifference(a: number, b: number) {
  const direct = Math.abs(((a - b + 540) % 360) - 180);
  return Math.min(direct, 180 - direct);
}

export function interpolate(a: Coordinate, b: Coordinate, fraction: number): Coordinate {
  return [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction];
}

export function lineSamples(a: Coordinate, b: Coordinate, spacingM: number) {
  const steps = Math.max(1, Math.ceil(distanceM(a, b) / spacingM));
  return Array.from({ length: steps }, (_, index) => interpolate(a, b, (index + 1) / steps));
}
