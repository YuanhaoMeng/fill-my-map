import { bearingDeg, distanceM, interpolate } from "../../core/geo";
import type { Coordinate, TrackPoint } from "../../core/types";

interface CleanTrackResult {
  points: readonly TrackPoint[];
  rejectedPoints: number;
}

const MAX_ACCURACY_M = 30;
const MAX_SPEED_MPS = 60;
const MAX_INTERPOLATION_GAP_S = 60;
const INTERPOLATION_SPACING_M = 10;

export function cleanTrack(points: readonly TrackPoint[]): CleanTrackResult {
  const cleaned: TrackPoint[] = [];
  let rejectedPoints = 0;
  for (const rawPoint of points) {
    const point = normalize(rawPoint);
    if (!isUsable(point)) {
      rejectedPoints += 1;
      continue;
    }
    const previous = cleaned.at(-1);
    if (!previous) {
      cleaned.push(point);
      continue;
    }
    const elapsedS = (point.recordedAt - previous.recordedAt) / 1_000;
    const distance = distanceM(previous.coordinate, point.coordinate);
    if (elapsedS <= 0 || distance / elapsedS > MAX_SPEED_MPS) {
      rejectedPoints += 1;
      continue;
    }
    if (elapsedS <= MAX_INTERPOLATION_GAP_S) {
      appendSegment(cleaned, previous, point, distance);
    } else {
      cleaned.push(point);
    }
  }
  return { points: cleaned, rejectedPoints };
}

function normalize(point: TrackPoint): TrackPoint {
  const speedMps = finite(point.speedMps) && point.speedMps! >= 0 ? point.speedMps : null;
  const headingDeg = finite(point.headingDeg) && point.headingDeg! >= 0
    ? ((point.headingDeg! % 360) + 360) % 360
    : null;
  return { ...point, speedMps, headingDeg };
}

function isUsable(point: TrackPoint) {
  const [longitude, latitude] = point.coordinate;
  return (
    finite(longitude) &&
    finite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90 &&
    finite(point.recordedAt) &&
    finite(point.accuracyM) &&
    point.accuracyM >= 0 &&
    point.accuracyM <= MAX_ACCURACY_M &&
    (point.speedMps === null || point.speedMps <= MAX_SPEED_MPS)
  );
}

function appendSegment(output: TrackPoint[], start: TrackPoint, end: TrackPoint, distance: number) {
  const steps = Math.max(1, Math.ceil(distance / INTERPOLATION_SPACING_M));
  const headingDeg = bearingDeg(start.coordinate, end.coordinate);
  for (let step = 1; step <= steps; step += 1) {
    const fraction = step / steps;
    output.push({
      ...end,
      recordedAt: Math.round(start.recordedAt + (end.recordedAt - start.recordedAt) * fraction),
      coordinate: interpolate(start.coordinate, end.coordinate, fraction) as Coordinate,
      accuracyM: Math.max(start.accuracyM, end.accuracyM),
      headingDeg,
    });
  }
}

function finite(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}
