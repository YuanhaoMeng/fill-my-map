import { useRef } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { CityProgress } from "../core/types";
import { useMessages } from "../i18n/useMessages";
import { LocalShareCardRenderer } from "../platform/share/LocalShareCardRenderer";
import { theme } from "./theme";

export function ShareProgressModal({ progress, onClose }: { progress: CityProgress | null; onClose: () => void }) {
  const { t } = useMessages();
  const cardRef = useRef<View>(null);
  const share = async () => {
    if (!progress) return;
    const renderer = new LocalShareCardRenderer(cardRef);
    await renderer.share(await renderer.renderProgress(progress));
  };
  if (!progress) return null;
  const city = t(progress.cityId === "ann-arbor" ? "annArbor" : "ypsilanti");
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View ref={cardRef} collapsable={false} style={styles.card}>
          <View style={styles.glowOne} />
          <View style={styles.glowTwo} />
          <Text style={styles.brand}>FILL MY MAP</Text>
          <View style={styles.content}>
            <Text style={styles.kicker}>{progress.percent >= 100 ? t("cityCompleted") : t("cityProgress")}</Text>
            <Text style={styles.city}>{city}</Text>
            <Text style={[styles.mode, { color: progress.mode === "walk" ? theme.colors.walk : theme.colors.drive }]}>
              {t(progress.mode)}
            </Text>
            <Text style={styles.percent}>{progress.percent.toFixed(2)}%</Text>
            <Text style={styles.detail}>{progress.completedEdges} / {progress.eligibleEdges} {t("roads")}</Text>
            <Text style={styles.detail}>{progress.excludedEdges} {t("excluded")}</Text>
          </View>
          <Text style={styles.privacy}>{t("sharePrivacy")}</Text>
          <Text style={styles.attribution}>{t("attribution")}</Text>
        </View>
        <View style={styles.actions}>
          <Button label={t("share")} onPress={() => void share()} />
          <Button label={t("close")} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.88)", alignItems: "center", justifyContent: "center" },
  card: { width: 360, height: 640, backgroundColor: theme.colors.background, overflow: "hidden", padding: 28 },
  glowOne: { position: "absolute", width: 420, height: 70, backgroundColor: theme.colors.walk, opacity: 0.16, top: 120, left: -80, transform: [{ rotate: "-18deg" }] },
  glowTwo: { position: "absolute", width: 440, height: 80, backgroundColor: theme.colors.drive, opacity: 0.18, bottom: 130, left: -20, transform: [{ rotate: "24deg" }] },
  brand: { color: theme.colors.text, fontSize: 15, fontWeight: "900", letterSpacing: 3 },
  content: { flex: 1, justifyContent: "center" },
  kicker: { color: theme.colors.muted, fontSize: 15, letterSpacing: 2, textTransform: "uppercase" },
  city: { color: theme.colors.text, fontSize: 39, fontWeight: "900", marginTop: 8 },
  mode: { fontSize: 18, fontWeight: "800", marginTop: 7 },
  percent: { color: theme.colors.both, fontSize: 68, fontWeight: "900", marginTop: 28 },
  detail: { color: theme.colors.text, fontSize: 15, marginTop: 8 },
  privacy: { color: theme.colors.muted, fontSize: 11, marginBottom: 8 },
  attribution: { color: theme.colors.muted, fontSize: 11 },
  actions: { flexDirection: "row", gap: 12, marginTop: 15 },
  button: { borderColor: theme.colors.walk, borderWidth: 1, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: theme.colors.text, fontWeight: "700" },
});
