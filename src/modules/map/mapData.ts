import type { FeatureCollection, LineString, MultiLineString, MultiPolygon, Point, Polygon } from "geojson";
import type { CoverageEdge, CoverageSegment, CoverageVisualState, TrackPoint } from "../../core/types";
import type { MapCityBoundary, MapLandmark, MapPlace } from "../../platform/database/CityNetworkRepository";

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
      properties: { id: edge.id, state: states[edge.id] ?? "unvisited" },
      geometry: { type: "LineString", coordinates: edge.coordinates.map(([lon, lat]) => [lon, lat]) },
    })),
  };
}

export function partialCoverageFeatures(
  segments: readonly CoverageSegment[],
): FeatureCollection<MultiLineString> {
  return {
    type: "FeatureCollection",
    features: segments.length
      ? [{ type: "Feature", id: "explored", properties: { state: "explored" }, geometry: { type: "MultiLineString", coordinates: segments.map(sampleLine) } }]
      : [],
  };
}

function sampleLine(segment: CoverageSegment): number[][] {
  const halfM = 7.5;
  const bearing = (segment.bearingDeg * Math.PI) / 180;
  const latitudeM = halfM * Math.cos(bearing);
  const longitudeM = halfM * Math.sin(bearing);
  const latitudeDelta = latitudeM / 111_320;
  const longitudeDelta = longitudeM / (111_320 * Math.cos((segment.coordinate[1] * Math.PI) / 180));
  return [
    [segment.coordinate[0] - longitudeDelta, segment.coordinate[1] - latitudeDelta],
    [segment.coordinate[0] + longitudeDelta, segment.coordinate[1] + latitudeDelta],
  ];
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

export function placeFeatures(items: readonly MapPlace[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: items.map((item) => ({
      type: "Feature", id: item.id,
      properties: {
        id: item.id,
        name: item.name,
        osmRef: item.osmRef,
        ...(item.detailPackId ? { detailPackId: item.detailPackId } : {}),
      },
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
