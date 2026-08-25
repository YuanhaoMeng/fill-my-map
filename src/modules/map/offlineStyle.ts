import type { StyleSpecification } from "@maplibre/maplibre-react-native";

export function offlineStyle(basemapUri: string): StyleSpecification {
  const source = "protomaps";
  return {
    version: 8,
    name: "Fill My Map Neon",
    sources: { [source]: { type: "vector", url: `pmtiles://${basemapUri}` } },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#07111D" } },
      layer("earth", "fill", source, "earth", { "fill-color": "#0C1824" }),
      layer("landuse", "fill", source, "landuse", { "fill-color": "#102230", "fill-opacity": 0.72 }),
      layer("water", "fill", source, "water", { "fill-color": "#082E43" }),
      layer("buildings", "fill", source, "buildings", { "fill-color": "#172A39" }),
      layer("roads", "line", source, "roads", {
        "line-color": "#26394C",
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.3, 16, 3],
      }),
      layer("boundaries", "line", source, "boundaries", {
        "line-color": "#496176",
        "line-dasharray": [3, 3],
        "line-width": 1,
      }),
    ],
  } as StyleSpecification;
}

function layer(id: string, type: "fill" | "line", source: string, sourceLayer: string, paint: object) {
  return { id, type, source, "source-layer": sourceLayer, paint };
}
