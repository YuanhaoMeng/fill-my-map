const EARTH_RADIUS_M = 6_371_000;
const radians = (value) => (value * Math.PI) / 180;

export function distanceM(a, b) {
  const lat1 = radians(a[1]);
  const lat2 = radians(b[1]);
  const dLat = lat2 - lat1;
  const dLon = radians(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function bearing(a, b) {
  const lat1 = radians(a[1]);
  const lat2 = radians(b[1]);
  const lon = radians(b[0] - a[0]);
  const y = Math.sin(lon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function samplesAlong(line, spacingM = 15) {
  const result = [];
  for (let index = 1; index < line.length; index += 1) {
    const a = line[index - 1];
    const b = line[index];
    const count = Math.max(1, Math.ceil(distanceM(a, b) / spacingM));
    for (let step = 1; step <= count; step += 1) {
      const fraction = step / count;
      result.push({
        coordinate: [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction],
        bearing: bearing(a, b),
      });
    }
  }
  return result;
}

export function midpoint(line) {
  return line[Math.floor(line.length / 2)];
}

export function contains(geometry, point) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.some((polygon) => inRing(polygon[0], point) && !polygon.slice(1).some((ring) => inRing(ring, point)));
}

function inRing(ring, point) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
