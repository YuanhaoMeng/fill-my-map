import { describe, expect, it } from "vitest";
import { shareCaption, withoutRawTrack } from "./shareSnapshot";

describe("exploration screenshot privacy", () => {
  it("removes the raw history overlay", () => {
    const safe = withoutRawTrack({ history: { type: "FeatureCollection", features: [] } } as never);
    expect(safe.history).toBeUndefined();
  });

  it("only exposes city progress and required attribution", () => {
    const caption = shareCaption("Ann Arbor", {
      cityId: "ann-arbor",
      completedEdges: 4,
      eligibleEdges: 10,
      excludedEdges: 0,
      percent: 40,
    });
    expect(caption).toEqual({ cityName: "Ann Arbor", percent: 40, attribution: "© OpenStreetMap contributors" });
    expect(JSON.stringify(caption)).not.toMatch(/route|endpoint|time|coordinate|session/i);
  });
});
