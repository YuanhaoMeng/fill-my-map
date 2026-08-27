import { useRef } from "react";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { CityProgress } from "../core/types";
import { useMessages } from "../i18n/useMessages";
import { LocalShareCardRenderer } from "../platform/share/LocalShareCardRenderer";
import { theme } from "./theme";
import { shareCaption } from "../modules/share/shareSnapshot";

export function ExplorationShareModal({
  imageUri,
  cityName,
  progress,
  onClose,
}: {
  imageUri: string | null;
  cityName: string;
  progress?: CityProgress;
  onClose: () => void;
}) {
  const { t } = useMessages();
  const cardRef = useRef<View>(null);
  if (!imageUri) return null;
  const caption = shareCaption(cityName, progress);
  const share = async () => {
    const renderer = new LocalShareCardRenderer(cardRef);
    await renderer.share(await renderer.render());
  };
  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View ref={cardRef} collapsable={false} style={styles.card}>
          <Image source={{ uri: imageUri }} resizeMode="cover" style={styles.map} />
          <View style={styles.caption}>
            <Text style={styles.brand}>FILL MY MAP</Text>
            <Text style={styles.city}>{caption.cityName}</Text>
            <Text style={styles.percent}>{caption.percent.toFixed(2)}%</Text>
            <Text style={styles.privacy}>{t("sharePrivacy")}</Text>
            <Text style={styles.attribution}>{caption.attribution}</Text>
          </View>
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
  screen: { alignItems: "center", backgroundColor: theme.colors.background, flex: 1, justifyContent: "center", padding: 18 },
  card: { backgroundColor: theme.colors.panel, height: 640, overflow: "hidden", width: 360 },
  map: { flex: 1, width: "100%" },
  caption: { backgroundColor: theme.colors.panel, padding: 20 },
  brand: { color: theme.colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 2 },
  city: { color: theme.colors.text, fontSize: 28, fontWeight: "900", marginTop: 5 },
  percent: { color: theme.colors.explored, fontSize: 40, fontWeight: "900", marginTop: 4 },
  privacy: { color: theme.colors.muted, fontSize: 9, marginTop: 6 },
  attribution: { color: theme.colors.muted, fontSize: 9, marginTop: 3 },
  actions: { flexDirection: "row", gap: 12, marginTop: 14 },
  button: { borderColor: theme.colors.explored, borderRadius: 12, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: theme.colors.text, fontWeight: "700" },
});
