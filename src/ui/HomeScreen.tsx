import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMessages } from "../i18n/useMessages";
import { useAppRuntime } from "../modules/app/useAppRuntime";
import { OfflineMap } from "./OfflineMap";
import { theme } from "./theme";
import { promptExclusion } from "./exclusionPrompt";
import { DataControlsModal } from "./DataControlsModal";
import { RewardsModal } from "./RewardsModal";
import { MissingRoadsModal } from "./MissingRoadsModal";
import { AboutModal } from "./AboutModal";
import { CityMapsModal } from "./CityMapsModal";
import { MoreMenuModal } from "./MoreMenuModal";
import { ExplorationShareModal } from "./ExplorationShareModal";

export function HomeScreen() {
  const { t } = useMessages();
  const runtime = useAppRuntime();
  const [showData, setShowData] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [captureRequest, setCaptureRequest] = useState(0);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const disabled = runtime.status !== "ready";
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.mapPlaceholder}>
        <OfflineMap
          status={runtime.status}
          map={runtime.map}
          showUserLocation={Boolean(runtime.session)}
          followSessionId={runtime.session?.id}
          userCoordinate={runtime.userCoordinate}
          onEdgeLongPress={(id, state) =>
            promptExclusion(id, state, t, runtime.exclude, runtime.undoExclusion)
          }
          captureRequest={captureRequest}
          onCapture={setShareImage}
        />
        <Text style={styles.logo}>{t("appName")}</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.privacy}>{runtime.session ? t("recording") : t("privacy")}</Text>
        {runtime.progress.map((progress) => (
          <View key={progress.cityId} style={styles.progressRow}>
            <Text style={styles.city}>{runtime.maps.active?.manifest.displayName ?? progress.cityId}</Text>
            <Text style={styles.percent}>{progress.percent.toFixed(2)}% {t("explored")}</Text>
          </View>
        ))}
        {runtime.actionError ? <Text style={styles.error}>{t("permissionDenied")}</Text> : null}
        <View style={styles.actions}>
          {runtime.session ? (
            <Action color={theme.colors.explored} label={t("stop")} onPress={() => void runtime.stop().then(() => setCaptureRequest((value) => value + 1))} />
          ) : (
            <Action disabled={disabled} color={theme.colors.explored} label={t("startExplore")} onPress={() => void runtime.start()} />
          )}
        </View>
        <Text style={styles.attribution}>{t("attribution")}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => setShowMenu(true)}>
          <Text style={styles.manage}>{t("menu")}</Text>
        </TouchableOpacity>
      </View>
      <DataControlsModal
        visible={showData}
        onClose={() => setShowData(false)}
        list={runtime.listSessions}
        view={runtime.viewSession}
        exportGpx={runtime.exportSession}
        deleteTrack={runtime.deleteTrack}
        deleteAllTracks={runtime.deleteAllTracks}
        resetAllData={runtime.resetAllData}
      />
      <RewardsModal visible={showRewards} rewards={runtime.rewards} cityName={runtime.maps.active?.manifest.displayName} onClose={() => setShowRewards(false)} />
      <MissingRoadsModal visible={showMissing} onClose={() => setShowMissing(false)} load={runtime.listMissing} />
      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
      <CityMapsModal
        visible={runtime.status === "needs-map" || showMaps}
        required={runtime.status === "needs-map"}
        catalog={runtime.maps.catalog}
        installed={runtime.maps.installed}
        active={runtime.maps.active}
        downloadProgress={runtime.maps.downloadProgress}
        error={runtime.actionError}
        onClose={() => setShowMaps(false)}
        onDownload={runtime.downloadMap}
        onImport={runtime.importMap}
        onActivate={runtime.activateMap}
        onDelete={runtime.deleteMap}
      />
      <MoreMenuModal
        visible={showMenu}
        sessionActive={Boolean(runtime.session)}
        rewardCount={runtime.rewards.length}
        onClose={() => setShowMenu(false)}
        onMaps={() => { setShowMenu(false); setShowMaps(true); }}
        onData={() => { setShowMenu(false); setShowData(true); }}
        onMissing={() => { setShowMenu(false); setShowMissing(true); }}
        onRewards={() => { setShowMenu(false); setShowRewards(true); }}
        onAbout={() => { setShowMenu(false); setShowAbout(true); }}
      />
      <ExplorationShareModal
        imageUri={shareImage}
        cityName={runtime.maps.active?.manifest.displayName ?? ""}
        progress={runtime.progress[0]}
        onClose={() => setShareImage(null)}
      />
    </SafeAreaView>
  );
}

function Action({ color, disabled, label, onPress }: { color: string; disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, { borderColor: color }, disabled && styles.disabled]}>
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  mapPlaceholder: { flex: 1 },
  logo: { color: theme.colors.text, fontSize: 22, fontWeight: "800", left: 18, position: "absolute", top: 12 },
  panel: { backgroundColor: theme.colors.panel, borderRadius: theme.radius, margin: 12, padding: 16 },
  privacy: { color: theme.colors.text, marginBottom: 14 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  city: { color: theme.colors.text, fontWeight: "600" },
  percent: { color: theme.colors.both, fontVariant: ["tabular-nums"] },
  error: { color: theme.colors.drive, fontSize: 12, marginBottom: 10 },
  actions: { flexDirection: "row", gap: 10 },
  button: { borderWidth: 1, borderRadius: 14, flex: 1, padding: 14 },
  buttonText: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.35 },
  attribution: { color: theme.colors.muted, fontSize: 11, marginTop: 14, textAlign: "center" },
  manage: { color: theme.colors.text, fontSize: 12, marginTop: 10, textAlign: "center", textDecorationLine: "underline" },
});
