export const packVersion = "2026.09.03-v4";
export const createdAt = "2026-09-03T16:00:00Z";
export const basemap = { url: "https://build.protomaps.com/20260811.pmtiles", maxZoom: 15 };
export const releaseBaseUrl =
  "https://github.com/YuanhaoMeng/fill-my-map/releases/download/maps-2026.09.03-v4";

export const osmSources = [{
  id: "michigan", snapshot: "michigan-260824.osm.pbf",
  url: "https://download.geofabrik.de/north-america/us/michigan-260824.osm.pbf",
  md5: "b41df6d74c13ca39949c0895a178f70c",
}];

export const packages = [
  {
    id: "united-states-overview", name: "Parks near Ypsilanti", kind: "overview", profile: "none",
    maxZoom: 7, center: [-83.612, 42.241], radiusMiles: 50,
    bbox: "-84.5907,41.5164,-82.6333,42.9656", tileBbox: "-125,24,-66.5,49.5",
    osmRef: "circle/ypsilanti-50mi", sourceIds: [], expected: { edges: 0, samples: 0, places: 21 },
  },
  {
    id: "pinckney-state-recreation-area", name: "Pinckney State Recreation Area",
    kind: "place", profile: "trail", parentId: "united-states-overview",
    center: [-83.9730189, 42.4155903], bbox: "-84.09,42.329,-83.935,42.475",
    osmRef: "relation/5664016", officialProjectId: "698", sourceIds: ["michigan"],
    officialSource: "Michigan DNR Trails Open Data", maxZoom: 15,
    expected: { edges: 365, samples: 13_026, places: 0 },
  },
];

export const dnrSource = {
  name: "Michigan DNR Trails Open Data",
  url: "https://gisagoegle.state.mi.us/arcgis/rest/services/DNR/DNRTrailsOPENDATA/FeatureServer",
  snapshot: "dnr-pinckney-2026-08-29.json",
};

export const dnrParkSource = {
  name: "Michigan DNR State Park Project Boundaries",
  url: "https://services3.arcgis.com/Jdnp1TjADvSDxMAX/arcgis/rest/services/DNRLOTSParcelsOPENDATA/FeatureServer/13",
  snapshot: "dnr-ypsilanti-50mi-parks-2026-09-03.geojson",
};
