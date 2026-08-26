import { Camera, GeoJSONSource, Layer, Map, type CameraRef, type MapRef, UserLocation } from "@maplibre/maplibre-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Coordinate } from "../core/types";
import { useMessages } from "../i18n/useMessages";
import type { MapContent } from "../modules/app/useAppRuntime";
import { theme } from "./theme";
import { nextCameraFollowState, type CameraFollowState } from "./cameraFollow";

export function OfflineMap({
  status,
  map,
  showUserLocation,
  followSessionId,
  userCoordinate,
  onEdgeLongPress,
}: {
  status: "loading" | "ready" | "error";
  map?: MapContent;
  showUserLocation: boolean;
  followSessionId?: string;
  userCoordinate?: Coordinate;
  onEdgeLongPress: (id: string, state: string) => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const centeredSession = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [suspendedFor, setSuspendedFor] = useState<string | null>(null);
  const { t } = useMessages();
  const suspended = Boolean(followSessionId && suspendedFor === followSessionId);
  const follow: CameraFollowState = !showUserLocation
    ? "inactive"
    : suspended ? "suspended" : userCoordinate ? "following" : "waiting";
  useEffect(() => {
    if (!mapReady || follow !== "following" || !userCoordinate) return;
    cameraRef.current?.flyTo({
      center: [userCoordinate[0], userCoordinate[1]],
      zoom: 16,
      bearing: 0,
      pitch: 0,
      duration: centeredSession.current === followSessionId ? 350 : 900,
      easing: "fly",
    });
    centeredSession.current = followSessionId ?? null;
  }, [follow, followSessionId, mapReady, userCoordinate]);
  if (status !== "ready" || !map) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.message}>{t(status === "error" ? "unavailable" : "loading")}</Text>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Map
      ref={mapRef}
      style={styles.map}
      mapStyle={map.style}
      attribution={false}
      logo={false}
      compass={true}
      onDidFinishLoadingMap={() => setMapReady(true)}
      onRegionWillChange={(event) => {
        if (event.nativeEvent.userInteraction) {
          const next = nextCameraFollowState(follow, "gesture");
          if (next === "suspended") setSuspendedFor(followSessionId ?? null);
        }
      }}
      onLongPress={(event) => {
        void mapRef.current
          ?.queryRenderedFeatures(event.nativeEvent.point, { layers: ["coverage-lines", "coverage-excluded"] })
          .then((features) => {
            const properties = features[0]?.properties;
            if (properties?.id) onEdgeLongPress(String(properties.id), String(properties.state));
          });
      }}
    >
      <Camera ref={cameraRef} initialViewState={{ center: [-83.69, 42.27], zoom: 10.7 }} />
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
            "line-color": theme.colors.muted,
            "line-opacity": 0.58,
            "line-width": 2.2,
          }}
        />
      </GeoJSONSource>
      <GeoJSONSource id="partial-coverage" data={map.partialCoverage}>
        <Layer
          id="partial-coverage-lines"
          type="line"
          layout={{ "line-cap": "round" }}
          paint={{
            "line-color": [
              "match", ["get", "state"],
              "walk", theme.colors.walk,
              "drive", theme.colors.drive,
              theme.colors.both,
            ],
            "line-opacity": 0.95,
            "line-width": 4,
          }}
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
      {showUserLocation && follow === "suspended" ? (
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.followButton}
          onPress={() => {
            const resumed = nextCameraFollowState(follow, "resume", Boolean(userCoordinate));
            if (resumed === "following") setSuspendedFor(null);
          }}
        >
          <Text style={styles.followText}>{t("resumeFollow")}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  followButton: { backgroundColor: theme.colors.panel, borderRadius: 18, bottom: 14, paddingHorizontal: 14, paddingVertical: 10, position: "absolute", right: 14 },
  followText: { color: theme.colors.text, fontSize: 12, fontWeight: "700" },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  message: { color: theme.colors.muted },
});
