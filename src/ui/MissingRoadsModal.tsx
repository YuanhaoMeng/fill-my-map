import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { MissingEdge } from "../core/types";
import { useMessages } from "../i18n/useMessages";
import { theme } from "./theme";

export function MissingRoadsModal({
  visible,
  onClose,
  load,
}: {
  visible: boolean;
  onClose: () => void;
  load: () => Promise<readonly MissingEdge[]>;
}) {
  const { t } = useMessages();
  const [edges, setEdges] = useState<readonly MissingEdge[]>([]);
  useEffect(() => {
    if (visible) void load().then(setEdges);
  }, [visible, load]);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("missingRoads")}</Text>
          <Button label={t("close")} onPress={onClose} />
        </View>
        <Text style={styles.note}>{edges.length} {t("roadsRemaining")}</Text>
        <Text style={styles.note}>{t("excludeHint")}</Text>
        <ScrollView contentContainerStyle={styles.list}>
          {edges.slice(0, 200).map((edge) => (
            <Text key={edge.id} style={styles.road}>• {edge.name ?? t("unnamedRoad")}</Text>
          ))}
          {edges.length > 200 ? <Text style={styles.note}>{t("showingFirst")}</Text> : null}
        </ScrollView>
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
  screen: { flex: 1, backgroundColor: theme.colors.background, padding: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: theme.colors.text, fontSize: 25, fontWeight: "900" },
  button: { borderColor: theme.colors.muted, borderWidth: 1, borderRadius: 10, padding: 10 },
  buttonText: { color: theme.colors.text, fontWeight: "700" },
  note: { color: theme.colors.muted, fontSize: 12, marginTop: 12 },
  list: { paddingVertical: 15 },
  road: { color: theme.colors.text, paddingVertical: 5 },
});
