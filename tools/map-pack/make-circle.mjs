import { writeFileSync } from "node:fs";

const [output, id, name, longitude, latitude, radiusMiles] = process.argv.slice(2);
if (!output || !id || !name || !longitude || !latitude || !radiusMiles) {
  throw new Error("Usage: make-circle output id name lon lat radius-miles");
}
const center = [Number(longitude), Number(latitude)];
const radiusM = Number(radiusMiles) * 1609.344;
const points = Array.from({ length: 73 }, (_, index) => destination(center, radiusM, index * 5));
const feature = {
  type: "Feature", id: `circle/${id}`, properties: { name },
  geometry: { type: "Polygon", coordinates: [points] },
};
writeFileSync(output, `\u001e${JSON.stringify(feature)}\n`);

function destination([lon, lat], distance, bearing) {
  const radius = 6_371_000;
  const angular = distance / radius;
  const direction = bearing * Math.PI / 180;
  const latitude1 = lat * Math.PI / 180;
  const longitude1 = lon * Math.PI / 180;
  const latitude2 = Math.asin(
    Math.sin(latitude1) * Math.cos(angular) + Math.cos(latitude1) * Math.sin(angular) * Math.cos(direction),
  );
  const longitude2 = longitude1 + Math.atan2(
    Math.sin(direction) * Math.sin(angular) * Math.cos(latitude1),
    Math.cos(angular) - Math.sin(latitude1) * Math.sin(latitude2),
  );
  return [longitude2 * 180 / Math.PI, latitude2 * 180 / Math.PI];
}
