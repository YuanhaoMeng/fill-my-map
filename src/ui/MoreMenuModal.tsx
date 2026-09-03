import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMessages } from "../i18n/useMessages";
import { theme } from "./theme";

export function MoreMenuModal({
  visible,
  sessionActive,
  rewardCount,
  explorationAvailable,
  onClose,
  onMaps,
  onData,
  onMissing,
  onRewards,
  onAbout,
}: {
  visible: boolean;
  sessionActive: boolean;
  rewardCount: number;
  explorationAvailable: boolean;
  onClose: () => void;
  onMaps: () => void;
  onData: () => void;
  onMissing: () => void;
  onRewards: () => void;
  onAbout: () => void;
}) {
  const { t } = useMessages();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity accessibilityLabel={t("close")} accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{t("menu")}</Text>
          <Item label={t("maps")} disabled={sessionActive} onPress={onMaps} />
          <Item label={t("manageData")} disabled={sessionActive} onPress={onData} />
          {explorationAvailable ? <Item label={t("missingRoads")} onPress={onMissing} /> : null}
          {explorationAvailable ? <Item label={`${t("rewards")} · ${rewardCount}`} onPress={onRewards} /> : null}
          <Item label={t("aboutLicenses")} onPress={onAbout} />
          <Item label={t("close")} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function Item({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={styles.item}>
      <Text style={[styles.label, disabled && styles.disabled]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0,0,0,0.55)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: theme.colors.panel, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34 },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: "800", marginBottom: 10 },
  item: { borderBottomColor: theme.colors.background, borderBottomWidth: 1, paddingVertical: 15 },
  label: { color: theme.colors.text, fontSize: 16 },
  disabled: { color: theme.colors.muted },
});
