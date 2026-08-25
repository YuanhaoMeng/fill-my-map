import { useRef, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RewardState } from "../core/types";
import { useMessages } from "../i18n/useMessages";
import { LocalShareCardRenderer } from "../platform/share/LocalShareCardRenderer";
import { theme } from "./theme";

export function RewardsModal({
  visible,
  rewards,
  onClose,
}: {
  visible: boolean;
  rewards: readonly RewardState[];
  onClose: () => void;
}) {
  const { t } = useMessages();
  const [selected, setSelected] = useState<RewardState | null>(null);
  const cardRef = useRef<View>(null);
  const share = async () => {
    const renderer = new LocalShareCardRenderer(cardRef);
    await renderer.share(await renderer.render());
  };
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.screen}>
        {selected ? (
          <>
            <View ref={cardRef} collapsable={false} style={styles.card}>
              <View style={styles.glow} />
              <Text style={styles.brand}>FILL MY MAP</Text>
              <View style={styles.center}>
                <Text style={styles.kicker}>{t(selected.kind === "landmark" ? "landmarkUnlocked" : "cityCompleted")}</Text>
                <Text style={styles.name}>{selected.kind === "landmark" ? selected.name : t(selected.cityId === "ann-arbor" ? "annArbor" : "ypsilanti")}</Text>
                <Text style={styles.city}>{selected.kind === "city" ? t(selected.mode) : t(selected.cityId === "ann-arbor" ? "annArbor" : "ypsilanti")}</Text>
                <Text style={styles.badge}>◆</Text>
              </View>
              <Text style={styles.privacy}>{t("sharePrivacy")}</Text>
              <Text style={styles.privacy}>{t("attribution")}</Text>
            </View>
            <View style={styles.actions}>
              <Button label={t("share")} onPress={() => void share()} />
              <Button label={t("back")} onPress={() => setSelected(null)} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>{t("rewards")}</Text>
              <Button label={t("close")} onPress={onClose} />
            </View>
            <ScrollView contentContainerStyle={styles.list}>
              {rewards.map((reward) => (
                <TouchableOpacity accessibilityRole="button" key={reward.kind === "landmark" ? reward.landmarkId : `${reward.cityId}-${reward.mode}`} style={styles.reward} onPress={() => setSelected(reward)}>
                  <Text style={styles.rewardName}>◆ {reward.kind === "landmark" ? reward.name : `${t("cityCompleted")} · ${t(reward.mode)}`}</Text>
                  <Text style={styles.city}>{t(reward.cityId === "ann-arbor" ? "annArbor" : "ypsilanti")}</Text>
                </TouchableOpacity>
              ))}
              {!rewards.length ? <Text style={styles.city}>{t("noRewards")}</Text> : null}
            </ScrollView>
          </>
        )}
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
  screen: { flex: 1, backgroundColor: theme.colors.background, alignItems: "center", padding: 18 },
  header: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: theme.colors.text, fontSize: 26, fontWeight: "900" },
  list: { width: "100%", gap: 10, paddingTop: 20 },
  reward: { backgroundColor: theme.colors.panel, borderRadius: 14, padding: 16 },
  rewardName: { color: theme.colors.both, fontSize: 17, fontWeight: "800" },
  city: { color: theme.colors.muted, marginTop: 6 },
  card: { width: 360, height: 640, backgroundColor: theme.colors.background, overflow: "hidden", padding: 28 },
  glow: { position: "absolute", width: 500, height: 110, backgroundColor: theme.colors.both, opacity: 0.16, top: 260, left: -70, transform: [{ rotate: "-20deg" }] },
  brand: { color: theme.colors.text, fontSize: 15, fontWeight: "900", letterSpacing: 3 },
  center: { flex: 1, justifyContent: "center" },
  kicker: { color: theme.colors.walk, fontSize: 15, fontWeight: "800", letterSpacing: 2 },
  name: { color: theme.colors.text, fontSize: 38, fontWeight: "900", marginTop: 12 },
  badge: { color: theme.colors.both, fontSize: 72, marginTop: 40 },
  privacy: { color: theme.colors.muted, fontSize: 11, marginTop: 6 },
  actions: { flexDirection: "row", gap: 12, marginTop: 12 },
  button: { borderColor: theme.colors.walk, borderWidth: 1, borderRadius: 10, padding: 10 },
  buttonText: { color: theme.colors.text, fontWeight: "700" },
});
