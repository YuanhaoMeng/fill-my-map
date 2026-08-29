import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";
import { Alert } from "react-native";
import type { MapContent } from "../modules/app/useAppRuntime";
import { theme } from "./theme";

export function OfflineMapLayers({ map, onPlacePress }: { map: MapContent; onPlacePress: (id: string | null, name: string) => void }) {
  return (
    <>
      <GeoJSONSource id="city-boundaries" data={map.boundaries}>
        <Layer
          id="city-boundary-lines"
          type="line"
          paint={{
            "line-color": theme.colors.both,
            "line-dasharray": [3, 2],
            "line-opacity": 0.72,
            "line-width": 1.8,
          }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="coverage" data={map.edges}>
        <Layer
          id="coverage-lines"
          type="line"
          filter={["!=", ["get", "state"], "excluded"]}
          paint={{ "line-color": theme.colors.muted, "line-opacity": 0.58, "line-width": 2.2 }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="partial-coverage" data={map.partialCoverage}>
        <Layer
          id="partial-coverage-lines"
          type="line"
          layout={{ "line-cap": "round" }}
          paint={{ "line-color": theme.colors.explored, "line-opacity": 0.95, "line-width": 4 }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="coverage-exclusions" data={map.edges}>
        <Layer
          id="coverage-excluded"
          type="line"
          filter={["==", ["get", "state"], "excluded"]}
          paint={{
            "line-color": theme.colors.excluded,
            "line-dasharray": [2, 2],
            "line-opacity": 0.8,
            "line-width": 2.2,
          }}
        />
      </GeoJSONSource>
      <GeoJSONSource
        id="landmarks"
        data={map.landmarks}
        onPress={(event) => {
          const name = event.nativeEvent.features[0]?.properties?.name;
          if (name) Alert.alert(String(name));
        }}
      >
        <Layer id="landmark-halo" type="circle" paint={{ "circle-color": theme.colors.both, "circle-opacity": 0.2, "circle-radius": 9 }} />
        <Layer id="landmark-dot" type="circle" paint={{ "circle-color": theme.colors.both, "circle-radius": 4, "circle-stroke-width": 1 }} />
      </GeoJSONSource>
      <GeoJSONSource
        id="places"
        data={map.places}
        cluster
        clusterMaxZoom={11}
        clusterRadius={35}
        onPress={(event) => {
          const properties = event.nativeEvent.features[0]?.properties;
          if (properties?.name) onPlacePress(properties.detailPackId ? String(properties.detailPackId) : null, String(properties.name));
        }}
      >
        <Layer id="park-clusters" type="circle" filter={["has", "point_count"]} paint={{ "circle-color": theme.colors.muted, "circle-opacity": 0.35, "circle-radius": 7 }} />
        <Layer id="park-halo" type="circle" filter={["!", ["has", "point_count"]]} paint={{ "circle-color": theme.colors.explored, "circle-opacity": 0.18, "circle-radius": 7 }} />
        <Layer
          id="park-dot"
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{ "circle-color": ["case", ["has", "detailPackId"], theme.colors.explored, theme.colors.muted], "circle-radius": 3.5 }}
        />
      </GeoJSONSource>
      {map.history ? (
        <GeoJSONSource id="history" data={map.history}>
          <Layer id="history-line" type="line" paint={{ "line-color": theme.colors.explored, "line-width": 4 }} />
        </GeoJSONSource>
      ) : null}
    </>
  );
}
