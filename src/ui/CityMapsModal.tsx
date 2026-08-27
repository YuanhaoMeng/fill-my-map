import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { CityCatalogEntry, InstalledCity } from "../modules/regions/cityPackTypes";
import { useMessages } from "../i18n/useMessages";
import { theme } from "./theme";

export function CityMapsModal({
  visible,
  required,
  catalog,
  installed,
  active,
  downloadProgress,
  error,
  onClose,
  onDownload,
  onImport,
  onActivate,
  onDelete,
}: {
  visible: boolean;
  required: boolean;
  catalog: readonly CityCatalogEntry[];
  installed: readonly InstalledCity[];
  active: InstalledCity | null;
  downloadProgress?: number;
  error: string | null;
  onClose: () => void;
  onDownload: (entry: CityCatalogEntry) => Promise<void>;
  onImport: () => Promise<void>;
  onActivate: (city: InstalledCity) => Promise<void>;
  onDelete: (city: InstalledCity) => Promise<void>;
}) {
  const { t } = useMessages();
  const busy = downloadProgress !== undefined && downloadProgress < 1;
  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("maps")}</Text>
          {!required ? <Button label={t("close")} onPress={onClose} /> : null}
        </View>
        <Text style={styles.subtitle}>{t("chooseCity")}</Text>
        <ScrollView contentContainerStyle={styles.list}>
          {catalog.map((entry) => {
            const local = installed.find((city) => city.manifest.id === entry.id && city.manifest.version === entry.version);
            const selected = local && active?.manifest.id === local.manifest.id && active.manifest.version === local.manifest.version;
            return (
              <View key={`${entry.id}-${entry.version}`} style={styles.row}>
                <View style={styles.details}>
                  <Text style={styles.name}>{entry.displayName}</Text>
                  <Text style={styles.meta}>{formatBytes(entry.sizeBytes)}</Text>
                </View>
                {selected ? <Text style={styles.active}>{t("active")}</Text> : local
                  ? <Button label={t("open")} onPress={() => void onActivate(local)} />
                  : <Button disabled={busy} label={busy ? `${t("downloading")} ${Math.round((downloadProgress ?? 0) * 100)}%` : t("download")} onPress={() => void onDownload(entry)} />}
                {local ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => confirmDelete(local, t("deleteMap"), t("mapProgressKept"), t("cancel"), t("delete"), onDelete)}
                  >
                    <Text style={styles.delete}>×</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
          {catalog.length === 0 ? <Text style={styles.meta}>{t("unavailable")}</Text> : null}
        </ScrollView>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={t("importMap")} onPress={() => void onImport()} />
        <Text style={styles.attribution}>{t("attribution")}</Text>
      </View>
    </Modal>
  );
}

function Button({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}>
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function confirmDelete(
  city: InstalledCity,
  title: string,
  message: string,
  cancel: string,
  remove: string,
  onDelete: (city: InstalledCity) => Promise<void>,
) {
  Alert.alert(title, message, [
    { text: cancel, style: "cancel" },
    { text: remove, style: "destructive", onPress: () => void onDelete(city) },
  ]);
}

function formatBytes(value: number) {
  return `${(value / 1_000_000).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.background, flex: 1, paddingHorizontal: 20, paddingBottom: 28, paddingTop: 64 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: "800" },
  subtitle: { color: theme.colors.muted, marginTop: 8 },
  list: { gap: 10, paddingVertical: 24 },
  row: { alignItems: "center", backgroundColor: theme.colors.panel, borderRadius: 14, flexDirection: "row", padding: 14 },
  details: { flex: 1 },
  name: { color: theme.colors.text, fontSize: 17, fontWeight: "700" },
  meta: { color: theme.colors.muted, marginTop: 4 },
  active: { color: theme.colors.both, fontWeight: "700" },
  button: { borderColor: theme.colors.both, borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  buttonText: { color: theme.colors.both, fontWeight: "700" },
  delete: { color: theme.colors.muted, fontSize: 24, marginLeft: 12 },
  error: { color: theme.colors.drive, marginBottom: 12 },
  attribution: { color: theme.colors.muted, fontSize: 11, marginTop: 18, textAlign: "center" },
  disabled: { opacity: 0.4 },
});
