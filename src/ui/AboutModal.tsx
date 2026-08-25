import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMessages } from "../i18n/useMessages";
import { theme } from "./theme";

export function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useMessages();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("aboutLicenses")}</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{t("close")}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Fill My Map 0.1.0</Text>
          <Text style={styles.body}>{t("openSourceNotice")}</Text>
          <Text style={styles.heading}>OpenStreetMap / ODbL 1.0</Text>
          <Text style={styles.body}>{t("mapLicenseNotice")}</Text>
          <Text style={styles.attribution}>{t("attribution")}</Text>
          <Text style={styles.body}>https://www.openstreetmap.org/copyright</Text>
          <Text style={styles.heading}>Map package</Text>
          <Text style={styles.body}>ann-arbor-ypsilanti · 2026.08.24-v1</Text>
          <Text style={styles.body}>Geofabrik Michigan 2026-08-24 · Protomaps Basemap 2026-08-24</Text>
          <Text style={styles.heading}>{t("privacyTitle")}</Text>
          <Text style={styles.body}>{t("privacySummary")}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, padding: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: "900" },
  button: { borderColor: theme.colors.muted, borderWidth: 1, borderRadius: 10, padding: 10 },
  buttonText: { color: theme.colors.text, fontWeight: "700" },
  content: { paddingVertical: 20 },
  heading: { color: theme.colors.both, fontSize: 18, fontWeight: "800", marginTop: 18 },
  body: { color: theme.colors.text, lineHeight: 21, marginTop: 8 },
  attribution: { color: theme.colors.walk, fontSize: 16, fontWeight: "800", marginTop: 10 },
});
