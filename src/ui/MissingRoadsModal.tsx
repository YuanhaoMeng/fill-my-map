import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { MissingEdge, TravelMode } from "../core/types";
import { useMessages } from "../i18n/useMessages";
import { theme } from "./theme";

export function MissingRoadsModal({
  visible,
  onClose,
  load,
}: {
  visible: boolean;
  onClose: () => void;
  load: (cityId: string, mode: TravelMode) => Promise<readonly MissingEdge[]>;
}) {
  const { t } = useMessages();
  const [city, setCity] = useState("ann-arbor");
  const [mode, setMode] = useState<TravelMode>("walk");
  const [edges, setEdges] = useState<readonly MissingEdge[]>([]);
  useEffect(() => {
    if (visible) void load(city, mode).then(setEdges);
  }, [visible, city, mode, load]);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("missingRoads")}</Text>
          <Button label={t("close")} onPress={onClose} />
        </View>
        <View style={styles.filters}>
          <Button label={t("annArbor")} active={city === "ann-arbor"} onPress={() => setCity("ann-arbor")} />
          <Button label={t("ypsilanti")} active={city === "ypsilanti"} onPress={() => setCity("ypsilanti")} />
        </View>
        <View style={styles.filters}>
          <Button label={t("walk")} active={mode === "walk"} onPress={() => setMode("walk")} />
          <Button label={t("drive")} active={mode === "drive"} onPress={() => setMode("drive")} />
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

function Button({ label, onPress, active }: { label: string; onPress: () => void; active?: boolean }) {
  return (
    <TouchableOpacity accessibilityRole="button" style={[styles.button, active && styles.active]} onPress={onPress}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, padding: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: theme.colors.text, fontSize: 25, fontWeight: "900" },
  filters: { flexDirection: "row", gap: 8, marginTop: 12 },
  button: { borderColor: theme.colors.muted, borderWidth: 1, borderRadius: 10, padding: 10 },
  active: { borderColor: theme.colors.walk, backgroundColor: theme.colors.panel },
  buttonText: { color: theme.colors.text, fontWeight: "700" },
  note: { color: theme.colors.muted, fontSize: 12, marginTop: 12 },
  list: { paddingVertical: 15 },
  road: { color: theme.colors.text, paddingVertical: 5 },
});
