export const packVersion = "2026.08.29-v3";
export const createdAt = "2026-08-29T23:30:00Z";
export const basemap = { url: "https://build.protomaps.com/20260824.pmtiles", maxZoom: 15 };
export const releaseBaseUrl =
  "https://github.com/YuanhaoMeng/fill-my-map/releases/download/maps-2026.08.29-v3";

export const osmSources = [
  {
    id: "michigan", snapshot: "michigan-260824.osm.pbf",
    url: "https://download.geofabrik.de/north-america/us/michigan-260824.osm.pbf",
    md5: "b41df6d74c13ca39949c0895a178f70c",
  },
  {
    id: "ohio", snapshot: "ohio-260824.osm.pbf",
    url: "https://download.geofabrik.de/north-america/us/ohio-260824.osm.pbf",
    md5: "76bb1924db102a27b6dba449df97de90",
  },
  {
    id: "ontario", snapshot: "ontario-260824.osm.pbf",
    url: "https://download.geofabrik.de/north-america/canada/ontario-260824.osm.pbf",
    md5: "93b8cb2a57566add6a75eaff68910579",
  },
];

export const packages = [
  {
    id: "ypsilanti-50mi", name: "Ypsilanti · 50 mi", kind: "overview", profile: "arterial",
    maxZoom: 14,
    center: [-83.612, 42.241], radiusMiles: 50,
    bbox: "-84.5907,41.5164,-82.6333,42.9656", osmRef: "circle/ypsilanti-50mi",
    sourceIds: ["michigan", "ohio", "ontario"],
    expected: { edges: 49_369, samples: 837_957, places: 7_726 },
  },
  {
    id: "pinckney-state-recreation-area", name: "Pinckney State Recreation Area",
    kind: "place", profile: "trail", parentId: "ypsilanti-50mi",
    center: [-83.9730189, 42.4155903], bbox: "-84.09,42.329,-83.935,42.475",
    osmRef: "relation/5664016", sourceIds: ["michigan"],
    officialSource: "Michigan DNR Trails Open Data",
    expected: { edges: 365, samples: 13_026, places: 0 },
  },
  {
    id: "county-farm-park", name: "County Farm Park", kind: "place", profile: "trail",
    parentId: "ypsilanti-50mi", center: [-83.7053675, 42.2551275],
    bbox: "-83.716,42.247,-83.695,42.264", osmRef: "way/192787288",
    sourceIds: ["michigan"], expected: { edges: 73, samples: 1_532, places: 0 },
  },
];

export const dnrSource = {
  name: "Michigan DNR Trails Open Data",
  url: "https://gisagoegle.state.mi.us/arcgis/rest/services/DNR/DNRTrailsOPENDATA/FeatureServer",
  snapshot: "dnr-pinckney-2026-08-29.json",
};
