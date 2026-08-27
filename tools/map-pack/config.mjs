export const pack = {
  id: "ann-arbor-ypsilanti",
  version: "2026.08.24-v1",
  createdAt: "2026-08-24T23:15:00Z",
  bbox: "-83.83,42.20,-83.55,42.34",
  osm: {
    url: "https://download.geofabrik.de/north-america/us/michigan-260824.osm.pbf",
    md5: "b41df6d74c13ca39949c0895a178f70c",
    snapshot: "michigan-260824.osm.pbf",
  },
  basemap: { url: "https://build.protomaps.com/20260824.pmtiles", maxZoom: 15 },
};

export const cities = [
  {
    id: "ann-arbor",
    name: "Ann Arbor",
    relationId: 135130,
    bbox: "-83.81,42.21,-83.665,42.334",
    expected: { edges: 4_843, samples: 70_995, landmarks: 5 },
  },
  {
    id: "ypsilanti",
    name: "Ypsilanti",
    relationId: 135135,
    bbox: "-83.662,42.214,-83.586,42.271",
    expected: { edges: 659, samples: 10_935, landmarks: 5 },
  },
];

export const cityPackVersion = "2026.08.24-v2";
export const catalogUrl = "https://yuanhaomeng.github.io/fill-my-map/maps/catalog.json";
export const releaseBaseUrl =
  "https://github.com/YuanhaoMeng/fill-my-map/releases/download/maps-2026.08.24-v2";

export const landmarks = [
  ["aa-stadium", "ann-arbor", "Michigan Stadium", -83.7487, 42.2658, "relation/1637002"],
  ["aa-diag", "ann-arbor", "The Diag", -83.7382, 42.2769, "way/176847689"],
  ["aa-arb", "ann-arbor", "Nichols Arboretum", -83.7248, 42.2807, "relation/10391031"],
  ["aa-kerrytown", "ann-arbor", "Kerrytown Market", -83.7466, 42.2847, "way/193502051"],
  ["aa-theater", "ann-arbor", "Michigan Theater", -83.7386, 42.2793, "node/9094921615"],
  ["ypsi-tower", "ypsilanti", "Ypsilanti Water Tower", -83.6178, 42.2407, "way/882710137"],
  ["ypsi-depot", "ypsilanti", "Depot Town", -83.6103, 42.245, "way/1121557325"],
  ["ypsi-riverside", "ypsilanti", "Riverside Park", -83.6122, 42.2442, "way/114540712"],
  ["ypsi-firehouse", "ypsilanti", "Michigan Firehouse Museum", -83.6174, 42.2411, "way/623595835"],
  ["ypsi-emu", "ypsilanti", "Eastern Michigan University", -83.627, 42.251, "relation/6930093"],
];
