import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { SessionSummary, TrackPoint } from "../../core/types";
import { gpx } from "./gpx";

export class GpxExporter {
  async export(session: SessionSummary, points: readonly TrackPoint[]) {
    if (!points.length) throw new Error("empty_track");
    const file = new File(Paths.cache, `fill-my-map-${session.id}.gpx`);
    if (file.exists) file.delete();
    file.create();
    file.write(gpx(session, points));
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/gpx+xml",
      UTI: "com.topografix.gpx",
      dialogTitle: "Export GPX",
    });
  }
}
