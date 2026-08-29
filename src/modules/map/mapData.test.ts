import { describe, expect, it } from "vitest";
import { cityBoundaryFeatures, landmarkFeatures, partialCoverageFeatures, placeFeatures } from "./mapData";

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

  it("renders partial samples as explored road segments", () => {
    const features = partialCoverageFeatures([
      { id: "1", edgeId: "a", coordinate: [-83.7, 42.2], bearingDeg: 90 },
      { id: "2", edgeId: "b", coordinate: [-83.6, 42.3], bearingDeg: 0 },
    ]);
    expect(features.features.map((feature) => feature.properties?.state)).toEqual(["explored"]);
    expect(features.features[0]?.geometry.coordinates[0]).toHaveLength(2);
  });

  it("marks only implemented parks with a downloadable detail pack", () => {
    const features = placeFeatures([
      { id: "pinckney", name: "Pinckney", coordinate: [-83.97, 42.42], osmRef: "relation/1", detailPackId: "pinckney-pack" },
      { id: "other", name: "Other park", coordinate: [-83.8, 42.3], osmRef: "way/2", detailPackId: null },
    ]);
    expect(features.features.map((feature) => feature.properties?.detailPackId)).toEqual(["pinckney-pack", undefined]);
  });
});
