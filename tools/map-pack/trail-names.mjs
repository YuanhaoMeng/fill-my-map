const METRES_PER_LAT = 111_320;

export function prepareDnrTrails(data) {
  return data.layers.flatMap((layer) => layer.features).flatMap((feature) => {
    const name = firstName(feature.properties ?? {});
    if (!name || name === "-1") return [];
    const geometry = feature.geometry;
    if (geometry?.type !== "LineString" && geometry?.type !== "MultiLineString") return [];
    const lines = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
    return lines.map((coordinates) => ({ name, coordinates }));
  });
}

export function nearestDnrTrailName(line, trails, maxDistanceM = 40) {
  const point = line[Math.floor(line.length / 2)];
  let nearest = { name: null, distance: Infinity };
  for (const trail of trails) {
    const distance = distanceToLineM(point, trail.coordinates);
    if (distance < nearest.distance) nearest = { name: trail.name, distance };
  }
  return nearest.distance <= maxDistanceM ? nearest.name : null;
}

const firstName = (properties) =>
  properties.TrailNamePrimary || properties.HikingName || properties.TrailNetwork;

function distanceToLineM(point, line) {
  let minimum = Infinity;
  for (let index = 1; index < line.length; index += 1) {
    minimum = Math.min(minimum, segmentDistanceM(point, line[index - 1], line[index]));
  }
  return minimum;
}

function segmentDistanceM(point, a, b) {
  const lonScale = METRES_PER_LAT * Math.cos(point[1] * Math.PI / 180);
  const px = (point[0] - a[0]) * lonScale;
  const py = (point[1] - a[1]) * METRES_PER_LAT;
  const bx = (b[0] - a[0]) * lonScale;
  const by = (b[1] - a[1]) * METRES_PER_LAT;
  const denominator = bx * bx + by * by;
  const fraction = denominator ? Math.max(0, Math.min(1, (px * bx + py * by) / denominator)) : 0;
  return Math.hypot(px - fraction * bx, py - fraction * by);
}
