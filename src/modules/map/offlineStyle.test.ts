import { describe, expect, it } from "vitest";
import { offlineStyle } from "./offlineStyle";

describe("offline map style", () => {
  it("uses only the bundled PMTiles source", () => {
    const style = offlineStyle("file:///bundled/basemap.pmtiles");
    expect(style.sources).toEqual({
      protomaps: { type: "vector", url: "pmtiles://file:///bundled/basemap.pmtiles" },
    });
    expect(JSON.stringify(style.sources)).not.toMatch(/https?:\/\//);
  });
});
