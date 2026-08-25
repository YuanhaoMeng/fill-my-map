import { Camera, GeoJSONSource, Layer, Map, type MapRef, UserLocation } from "@maplibre/maplibre-react-native";
import { useRef } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useMessages } from "../i18n/useMessages";
import type { MapContent } from "../modules/app/useAppRuntime";
import { theme } from "./theme";

export function OfflineMap({
  status,
  map,
  showUserLocation,
  onEdgeLongPress,
}: {
  status: "loading" | "ready" | "error";
  map?: MapContent;
  showUserLocation: boolean;
  onEdgeLongPress: (id: string, state: string) => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const { t } = useMessages();
  if (status !== "ready" || !map) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.message}>{t(status === "error" ? "unavailable" : "loading")}</Text>
      </View>
    );
  }
  return (
    <Map
      ref={mapRef}
      style={styles.map}
      mapStyle={map.style}
      attribution={false}
      logo={false}
      compass={true}
      onLongPress={(event) => {
        void mapRef.current
          ?.queryRenderedFeatures(event.nativeEvent.point, { layers: ["coverage-lines", "coverage-excluded"] })
          .then((features) => {
            const properties = features[0]?.properties;
            if (properties?.id) onEdgeLongPress(String(properties.id), String(properties.state));
          });
      }}
    >
      <Camera initialViewState={{ center: [-83.69, 42.27], zoom: 10.7 }} />
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
          paint={{
            "line-color": [
              "match",
              ["get", "state"],
              "walk",
              theme.colors.walk,
              "drive",
              theme.colors.drive,
              "both",
              theme.colors.both,
              "excluded",
              theme.colors.excluded,
              theme.colors.muted,
            ],
            "line-opacity": 0.82,
            "line-width": 2.2,
          }}
        />
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
        <Layer
          id="landmark-halo"
          type="circle"
          paint={{ "circle-color": theme.colors.both, "circle-opacity": 0.2, "circle-radius": 9 }}
        />
        <Layer
          id="landmark-dot"
          type="circle"
          paint={{ "circle-color": theme.colors.both, "circle-radius": 4, "circle-stroke-width": 1 }}
        />
      </GeoJSONSource>
      {map.history ? (
        <GeoJSONSource id="history" data={map.history}>
          <Layer
            id="history-line"
            type="line"
            paint={{
              "line-color": map.historyMode === "drive" ? theme.colors.drive : theme.colors.walk,
              "line-width": 4,
            }}
          />
        </GeoJSONSource>
      ) : null}
      {showUserLocation ? <UserLocation /> : null}
    </Map>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  message: { color: theme.colors.muted },
});
