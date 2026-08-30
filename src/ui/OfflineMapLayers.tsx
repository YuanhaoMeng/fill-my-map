import { GeoJSONSource, Layer } from "@maplibre/maplibre-react-native";
import { Alert } from "react-native";
import type { MapContent } from "../modules/app/useAppRuntime";
import { theme } from "./theme";

export function OfflineMapLayers({ map, mapKey, onPlacePress }: { map: MapContent; mapKey: string; onPlacePress: (id: string | null, name: string) => void }) {
  const id = (name: string) => `${name}-${mapKey}`;
  return (
    <>
      {map.boundaries.features.length ? <GeoJSONSource id={id("city-boundaries")} data={map.boundaries}>
        <Layer
          id={id("city-boundary-lines")}
          type="line"
          paint={{
            "line-color": theme.colors.both,
            "line-dasharray": [3, 2],
            "line-opacity": 0.72,
            "line-width": 1.8,
          }}
        />
      </GeoJSONSource> : null}
      <GeoJSONSource id={id("coverage")} data={map.edges}>
        <Layer
          id={id("coverage-lines")}
          type="line"
          filter={["!=", ["get", "state"], "excluded"]}
          paint={{ "line-color": theme.colors.muted, "line-opacity": 0.58, "line-width": 2.2 }}
        />
        <Layer
          id={id("coverage-excluded")}
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
      {map.partialCoverage.features.length ? <GeoJSONSource id={id("partial-coverage")} data={map.partialCoverage}>
        <Layer
          id={id("partial-coverage-lines")}
          type="line"
          layout={{ "line-cap": "round" }}
          paint={{ "line-color": theme.colors.explored, "line-opacity": 0.95, "line-width": 4 }}
        />
      </GeoJSONSource> : null}
      {map.landmarks.features.length ? <GeoJSONSource
        id={id("landmarks")}
        data={map.landmarks}
        onPress={(event) => {
          const name = event.nativeEvent.features[0]?.properties?.name;
          if (name) Alert.alert(String(name));
        }}
      >
        <Layer id={id("landmark-halo")} type="circle" paint={{ "circle-color": theme.colors.both, "circle-opacity": 0.2, "circle-radius": 9 }} />
        <Layer id={id("landmark-dot")} type="circle" paint={{ "circle-color": theme.colors.both, "circle-radius": 4, "circle-stroke-width": 1 }} />
      </GeoJSONSource> : null}
      {map.places.features.length ? <GeoJSONSource
        id={id("places")}
        data={map.places}
        cluster
        clusterMaxZoom={11}
        clusterRadius={35}
        onPress={(event) => {
          const properties = event.nativeEvent.features[0]?.properties;
          if (properties?.name) onPlacePress(properties.detailPackId ? String(properties.detailPackId) : null, String(properties.name));
        }}
      >
        <Layer id={id("park-clusters")} type="circle" filter={["has", "point_count"]} paint={{ "circle-color": theme.colors.muted, "circle-opacity": 0.35, "circle-radius": 7 }} />
        <Layer id={id("park-halo")} type="circle" filter={["!", ["has", "point_count"]]} paint={{ "circle-color": theme.colors.explored, "circle-opacity": 0.18, "circle-radius": 7 }} />
        <Layer
          id={id("park-dot")}
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{ "circle-color": ["case", ["has", "detailPackId"], theme.colors.explored, theme.colors.muted], "circle-radius": 3.5 }}
        />
      </GeoJSONSource> : null}
      {map.detailPlaces.features.length ? <GeoJSONSource
        id={id("detail-places")}
        data={map.detailPlaces}
        hitbox={{ top: 18, right: 18, bottom: 18, left: 18 }}
        onPress={(event) => {
          const properties = event.nativeEvent.features[0]?.properties;
          if (properties?.name && properties.detailPackId) onPlacePress(String(properties.detailPackId), String(properties.name));
        }}
      >
        <Layer id={id("detail-park-halo")} type="circle" paint={{ "circle-color": theme.colors.explored, "circle-opacity": 0.28, "circle-radius": 11 }} />
        <Layer id={id("detail-park-dot")} type="circle" paint={{ "circle-color": theme.colors.explored, "circle-radius": 5, "circle-stroke-width": 1 }} />
      </GeoJSONSource> : null}
      {map.history?.features.length ? (
        <GeoJSONSource id={id("history")} data={map.history}>
          <Layer id={id("history-line")} type="line" paint={{ "line-color": theme.colors.explored, "line-width": 4 }} />
        </GeoJSONSource>
      ) : null}
    </>
  );
}
