import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMessages } from "../i18n/useMessages";
import { useAppRuntime } from "../modules/app/useAppRuntime";
import { OfflineMap } from "./OfflineMap";
import { theme } from "./theme";
import { promptExclusion } from "./exclusionPrompt";
import { DataControlsModal } from "./DataControlsModal";
import { ShareProgressModal } from "./ShareProgressModal";
import type { CityProgress } from "../core/types";
import { RewardsModal } from "./RewardsModal";
import { MissingRoadsModal } from "./MissingRoadsModal";
import { AboutModal } from "./AboutModal";

export function HomeScreen() {
  const { t } = useMessages();
  const runtime = useAppRuntime();
  const [showData, setShowData] = useState(false);
  const [shareProgress, setShareProgress] = useState<CityProgress | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
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
        />
        <Text style={styles.logo}>{t("appName")}</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.privacy}>{runtime.session ? t("recording") : t("privacy")}</Text>
        {runtime.progress.map((progress) => (
          <TouchableOpacity accessibilityRole="button" key={`${progress.cityId}-${progress.mode}`} style={styles.progressRow} onPress={() => setShareProgress(progress)}>
            <Text style={styles.city}>{t(progress.cityId === "ann-arbor" ? "annArbor" : "ypsilanti")} · {t(progress.mode)}</Text>
            <Text style={styles.percent}>{progress.percent.toFixed(2)}% {t("explored")}</Text>
          </TouchableOpacity>
        ))}
        {runtime.actionError ? <Text style={styles.error}>{t("permissionDenied")}</Text> : null}
        <View style={styles.actions}>
          {runtime.session ? (
            <Action color={theme.colors.both} label={t("stop")} onPress={() => void runtime.stop()} />
          ) : (
            <>
              <Action disabled={disabled} color={theme.colors.walk} label={t("startWalk")} onPress={() => void runtime.start("walk")} />
              <Action disabled={disabled} color={theme.colors.drive} label={t("startDrive")} onPress={() => void runtime.start("drive")} />
            </>
          )}
        </View>
        <Text style={styles.attribution}>{t("attribution")}</Text>
        <TouchableOpacity accessibilityRole="button" disabled={Boolean(runtime.session)} onPress={() => setShowData(true)}>
          <Text style={[styles.manage, runtime.session && styles.disabled]}>{t("manageData")}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => setShowMissing(true)}>
          <Text style={styles.manage}>{t("missingRoads")}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => setShowRewards(true)}>
          <Text style={styles.manage}>{t("rewards")} · {runtime.rewards.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={() => setShowAbout(true)}>
          <Text style={styles.manage}>{t("aboutLicenses")}</Text>
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
      <ShareProgressModal progress={shareProgress} onClose={() => setShareProgress(null)} />
      <RewardsModal visible={showRewards} rewards={runtime.rewards} onClose={() => setShowRewards(false)} />
      <MissingRoadsModal visible={showMissing} onClose={() => setShowMissing(false)} load={runtime.listMissing} />
      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
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
