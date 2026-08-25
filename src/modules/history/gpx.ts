import type { SessionSummary, TrackPoint } from "../../core/types";

export function gpx(session: SessionSummary, points: readonly TrackPoint[]) {
  const trackPoints = points
    .map(
      (point) =>
        `      <trkpt lat="${point.coordinate[1]}" lon="${point.coordinate[0]}"><time>${new Date(point.recordedAt).toISOString()}</time></trkpt>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Fill My Map" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>Fill My Map ${session.mode}</name></metadata>
  <trk><name>${session.id}</name><trkseg>
${trackPoints}
  </trkseg></trk>
</gpx>\n`;
}
