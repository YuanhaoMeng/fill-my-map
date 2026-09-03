export const packVersion = "2026.09.03-v5";
export const createdAt = "2026-09-03T16:15:00Z";
export const basemap = { url: "https://build.protomaps.com/20260811.pmtiles", maxZoom: 15 };
export const releaseBaseUrl =
  "https://github.com/YuanhaoMeng/fill-my-map/releases/download/maps-2026.09.03-v5";

export const osmSources = [{
  id: "michigan", snapshot: "michigan-260824.osm.pbf",
  url: "https://download.geofabrik.de/north-america/us/michigan-260824.osm.pbf",
  md5: "b41df6d74c13ca39949c0895a178f70c",
}];

const parentId = "united-states-overview";
const park = (id, name, officialProjectId) => ({
  id, name, officialProjectId, kind: "place", profile: "trail", parentId,
  osmRef: `dnr-project/${officialProjectId}`, sourceIds: ["michigan"], maxZoom: 15,
});

export const packages = [
  {
    id: parentId, name: "Parks near Ypsilanti", kind: "overview", profile: "none",
    maxZoom: 7, center: [-83.612, 42.241], radiusMiles: 50,
    bbox: "-84.5907,41.5164,-82.6333,42.9656", tileBbox: "-125,24,-66.5,49.5",
    osmRef: "circle/ypsilanti-50mi", sourceIds: [], expected: { edges: 0, samples: 0, places: 21 },
  },
  park("bald-mountain-state-recreation-area", "Bald Mountain State Recreation Area", "686"),
  park("brighton-state-recreation-area", "Brighton State Recreation Area", "688"),
  park("cambridge-junction-historic-state-park", "Cambridge Junction Historic State Park", "183"),
  park("dodge-4-state-park", "Dodge 4 State Park", "189"),
  park("hayes-state-park", "Hayes State Park", "202"),
  park("highland-state-recreation-area", "Highland State Recreation Area", "690"),
  park("holly-state-recreation-area", "Holly State Recreation Area", "691"),
  park("island-lake-state-recreation-area", "Island Lake State Recreation Area", "694"),
  park("lake-hudson-state-recreation-area", "Lake Hudson State Recreation Area", "692"),
  park("maybury-state-park", "Maybury State Park", "216"),
  park("meridian-baseline-state-park", "Meridian-Baseline State Park", "meridian-baseline-state-park"),
  park("metamora-hadley-state-recreation-area", "Metamora-Hadley State Recreation Area", "695"),
  park("milliken-state-park-and-harbor", "Milliken State Park and Harbor", "925"),
  park("ortonville-state-recreation-area", "Ortonville State Recreation Area", "696"),
  {
    ...park("pinckney-state-recreation-area", "Pinckney State Recreation Area", "698"),
    center: [-83.9730189, 42.4155903], bbox: "-84.09,42.329,-83.935,42.475",
    osmRef: "relation/5664016", officialSource: "Michigan DNR Trails Open Data",
    expected: { edges: 365, samples: 13_026, places: 0 },
  },
  park("pontiac-lake-state-recreation-area", "Pontiac Lake State Recreation Area", "699"),
  park("proud-lake-state-recreation-area", "Proud Lake State Recreation Area", "700"),
  park("seven-lakes-state-park", "Seven Lakes State Park", "241"),
  park("sterling-state-park", "Sterling State Park", "245"),
  park("waterloo-state-recreation-area", "Waterloo State Recreation Area", "704"),
  park("watkins-lake-state-park", "Watkins Lake State Park", "982"),
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
