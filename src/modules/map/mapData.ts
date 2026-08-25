import type { FeatureCollection, LineString, MultiPolygon, Point, Polygon } from "geojson";
import type { CoverageEdge, CoverageVisualState, TrackPoint } from "../../core/types";
import type { MapCityBoundary, MapLandmark } from "../../platform/database/BundledNetworkRepository";

export function cityBoundaryFeatures(items: readonly MapCityBoundary[]): FeatureCollection<Polygon | MultiPolygon> {
  return {
    type: "FeatureCollection",
    features: items.map((item) => ({
      type: "Feature",
      id: item.id,
      properties: { id: item.id, name: item.name },
      geometry: item.geometry,
    })),
  };
}

export function edgeFeatures(
  edges: readonly CoverageEdge[],
  states: Readonly<Record<string, CoverageVisualState>> = {},
): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: edges.map((edge) => ({
      type: "Feature",
      id: edge.id,
      properties: { id: edge.id, modes: edge.modes.join(","), state: states[edge.id] ?? "unvisited" },
      geometry: { type: "LineString", coordinates: edge.coordinates.map(([lon, lat]) => [lon, lat]) },
    })),
  };
}

export function landmarkFeatures(items: readonly MapLandmark[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: items.map((item) => ({
      type: "Feature",
      id: item.id,
      properties: { id: item.id, name: item.name, cityId: item.cityId },
      geometry: { type: "Point", coordinates: [...item.coordinate] },
    })),
  };
}

export function trackFeature(points: readonly TrackPoint[]): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: points.length
      ? [
          {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: points.map((point) => [...point.coordinate]) },
          },
        ]
      : [],
  };
}
