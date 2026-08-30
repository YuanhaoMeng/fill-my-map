import { Camera, Map, type CameraRef, type MapRef, UserLocation } from "@maplibre/maplibre-react-native";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import type { Coordinate } from "../core/types";
import { useMessages } from "../i18n/useMessages";
import type { MapContent } from "../modules/app/useAppRuntime";
import { theme } from "./theme";
import { nextCameraFollowState, type CameraFollowState } from "./cameraFollow";
import { OfflineMapLayers } from "./OfflineMapLayers";
import { placeHit, placeHitBounds } from "./placeHit";
import { shareCameraStop } from "./shareCamera";

export function OfflineMap({
  status,
  map,
  mapKey,
  showUserLocation,
  followSessionId,
  userCoordinate,
  onEdgeLongPress,
  captureRequest,
  onCapture,
  onPlacePress,
}: {
  status: "loading" | "needs-map" | "ready" | "error";
  map?: MapContent;
  mapKey: string;
  showUserLocation: boolean;
  followSessionId?: string;
  userCoordinate?: Coordinate;
  onEdgeLongPress: (id: string, state: string) => void;
  captureRequest?: number;
  onCapture?: (uri: string) => void;
  onPlacePress: (id: string | null, name: string) => void;
}) {
  const captureViewRef = useRef<View>(null);
  const mapRef = useRef<MapRef>(null);
  const cameraRef = useRef<CameraRef>(null);
  const centeredSession = useRef<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [suspendedFor, setSuspendedFor] = useState<string | null>(null);
  const pendingCapture = useRef<number | null>(null);
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
  useEffect(() => {
    if (!captureRequest || !mapReady || !map) return;
    pendingCapture.current = captureRequest;
    void cameraRef.current?.setStop(shareCameraStop(map.bounds));
  }, [captureRequest, map, mapReady]);
  if (status !== "ready" || !map) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.message}>{t(status === "error" ? "unavailable" : "loading")}</Text>
      </View>
    );
  }
  return (
    <View ref={captureViewRef} collapsable={false} style={styles.container}>
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
      onRegionDidChange={() => {
        if (!pendingCapture.current) return;
        pendingCapture.current = null;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          void captureRef(captureViewRef, { format: "png", quality: 1, result: "tmpfile" }).then(onCapture);
        }));
      }}
      onLongPress={(event) => {
        void mapRef.current
            ?.queryRenderedFeatures(event.nativeEvent.point, { layers: [`coverage-lines-${mapKey}`, `coverage-excluded-${mapKey}`] })
          .then((features) => {
            const properties = features[0]?.properties;
            if (properties?.id) onEdgeLongPress(String(properties.id), String(properties.state));
          });
      }}
      onPress={(event) => {
        const layers = [
          `detail-park-dot-${mapKey}`,
          `detail-park-halo-${mapKey}`,
          `park-dot-${mapKey}`,
          `park-halo-${mapKey}`,
        ];
        void mapRef.current
          ?.queryRenderedFeatures(placeHitBounds(event.nativeEvent.point), { layers })
          .then((features) => {
            const hit = placeHit(features);
            if (hit) onPlacePress(hit.id, hit.name);
          });
      }}
    >
      <Camera ref={cameraRef} initialViewState={{ bounds: [...map.bounds] }} />
      {mapReady ? <OfflineMapLayers map={map} mapKey={mapKey} /> : null}
      {mapReady && showUserLocation ? <UserLocation /> : null}
      </Map>
      <Text style={styles.attribution}>{t("attribution")}</Text>
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
  attribution: { bottom: 5, color: theme.colors.text, fontSize: 9, opacity: 0.8, position: "absolute", right: 7 },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  message: { color: theme.colors.muted },
});
