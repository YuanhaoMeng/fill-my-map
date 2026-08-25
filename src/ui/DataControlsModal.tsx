import { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { SessionSummary } from "../core/types";
import { useMessages } from "../i18n/useMessages";
import { theme } from "./theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  list: () => Promise<readonly SessionSummary[]>;
  view: (session: SessionSummary) => Promise<void>;
  exportGpx: (session: SessionSummary) => Promise<void>;
  deleteTrack: (id: string) => Promise<unknown>;
  deleteAllTracks: () => Promise<unknown>;
  resetAllData: () => Promise<void>;
}

export function DataControlsModal(props: Props) {
  const { t } = useMessages();
  const { list, visible } = props;
  const [sessions, setSessions] = useState<readonly SessionSummary[]>([]);
  const reload = () => void list().then(setSessions);
  useEffect(() => {
    if (visible) void list().then(setSessions);
  }, [visible, list]);
  const remove = (session: SessionSummary) =>
    Alert.alert(t("deleteTrack"), t("progressKept"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: () => void props.deleteTrack(session.id).then(reload) },
    ]);
  const clearTracks = () =>
    Alert.alert(t("deleteAllTracks"), t("progressKept"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: () => void props.deleteAllTracks().then(reload) },
    ]);
  const reset = () =>
    Alert.alert(t("resetAll"), t("resetWarning"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("continue"),
        style: "destructive",
        onPress: () =>
          Alert.alert(t("confirmReset"), t("cannotUndo"), [
            { text: t("cancel"), style: "cancel" },
            { text: t("reset"), style: "destructive", onPress: () => void props.resetAllData().then(reload) },
          ]),
      },
    ]);
  return (
    <Modal visible={props.visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={props.onClose}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("dataAndHistory")}</Text>
          <SmallButton label={t("close")} onPress={props.onClose} />
        </View>
        <Text style={styles.note}>{t("localOnly")}</Text>
        <ScrollView contentContainerStyle={styles.list}>
          {sessions.length ? sessions.map((session) => (
            <View key={session.id} style={styles.session}>
              <Text style={styles.sessionTitle}>{t(session.mode)} · {new Date(session.startedAt).toLocaleString()}</Text>
              <Text style={styles.note}>{session.pointCount} {t("trackPoints")} · {session.status}</Text>
              <View style={styles.row}>
                <SmallButton label={t("view")} onPress={() => void props.view(session).then(props.onClose)} />
                <SmallButton label={t("exportGpx")} onPress={() => void props.exportGpx(session)} />
                <SmallButton label={t("delete")} danger onPress={() => remove(session)} />
              </View>
            </View>
          )) : <Text style={styles.note}>{t("noSessions")}</Text>}
        </ScrollView>
        <View style={styles.dangerZone}>
          <SmallButton label={t("deleteAllTracks")} danger onPress={clearTracks} />
          <SmallButton label={t("resetAll")} danger onPress={reset} />
        </View>
      </View>
    </Modal>
  );
}

function SmallButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity accessibilityRole="button" style={styles.smallButton} onPress={onPress}>
      <Text style={[styles.smallText, danger && styles.danger]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, padding: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  title: { color: theme.colors.text, fontSize: 24, fontWeight: "800" },
  note: { color: theme.colors.muted, fontSize: 12, marginTop: 6 },
  list: { gap: 10, paddingVertical: 18 },
  session: { backgroundColor: theme.colors.panel, borderRadius: 14, padding: 14 },
  sessionTitle: { color: theme.colors.text, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  smallButton: { borderColor: theme.colors.muted, borderWidth: 1, borderRadius: 10, padding: 9 },
  smallText: { color: theme.colors.text, fontWeight: "600" },
  danger: { color: theme.colors.drive },
  dangerZone: { borderTopColor: theme.colors.muted, borderTopWidth: 1, flexDirection: "row", gap: 10, paddingTop: 14 },
});
