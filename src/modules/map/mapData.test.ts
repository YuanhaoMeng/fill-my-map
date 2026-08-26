import { describe, expect, it } from "vitest";
import { cityBoundaryFeatures, landmarkFeatures, partialCoverageFeatures } from "./mapData";

describe("offline map overlays", () => {
  it("renders the two configured city boundaries from bundled geometry", () => {
    const features = cityBoundaryFeatures([
      {
        id: "ann-arbor",
        name: "Ann Arbor",
        geometry: { type: "Polygon", coordinates: [[[-83.8, 42.2], [-83.7, 42.2], [-83.8, 42.2]]] },
      },
      {
        id: "ypsilanti",
        name: "Ypsilanti",
        geometry: { type: "MultiPolygon", coordinates: [[[[-83.65, 42.2], [-83.6, 42.2], [-83.65, 42.2]]]] },
      },
    ]);
    expect(features.features.map((feature) => feature.id)).toEqual(["ann-arbor", "ypsilanti"]);
  });

  it("keeps landmark identity and city in the local GeoJSON", () => {
    const features = landmarkFeatures([
      { id: "landmark", name: "Landmark", cityId: "ann-arbor", coordinate: [-83.7, 42.2], radiusM: 75 },
    ]);
    expect(features.features[0]?.properties).toMatchObject({ id: "landmark", cityId: "ann-arbor" });
  });

  it("renders partial samples as mode-colored road segments", () => {
    const features = partialCoverageFeatures([
      { id: "1", edgeId: "a", coordinate: [-83.7, 42.2], bearingDeg: 90, state: "walk" },
      { id: "2", edgeId: "b", coordinate: [-83.6, 42.3], bearingDeg: 0, state: "drive" },
    ]);
    expect(features.features.map((feature) => feature.properties?.state)).toEqual(["walk", "drive"]);
    expect(features.features[0]?.geometry.coordinates[0]).toHaveLength(2);
  });
});
