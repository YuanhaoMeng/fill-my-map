import { Alert } from "react-native";
import type { ExclusionReason } from "../core/types";
import type { MessageKey } from "../i18n/messages";

type Translate = (key: MessageKey) => string;

export function promptExclusion(
  edgeId: string,
  state: string,
  t: Translate,
  exclude: (edgeId: string, reason: ExclusionReason) => Promise<void>,
  undo: (edgeId: string) => Promise<void>,
) {
  if (state === "excluded") {
    Alert.alert(t("restoreRoad"), undefined, [
      { text: t("continue"), onPress: () => void undo(edgeId) },
      { text: t("cancel"), style: "cancel" },
    ]);
    return;
  }
  chooseReason(edgeId, t, exclude);
}

function chooseReason(
  edgeId: string,
  t: Translate,
  exclude: (edgeId: string, reason: ExclusionReason) => Promise<void>,
) {
  const reasons: readonly [ExclusionReason, MessageKey][] = [
    ["private", "privateRoad"],
    ["closed", "closedRoad"],
    ["unsafe", "unsafeRoad"],
    ["map_error", "mapError"],
    ["other", "other"],
  ];
  Alert.alert(t("excludeReason"), undefined, [
    ...reasons.map(([reason, label]) => ({ text: t(label), onPress: () => void exclude(edgeId, reason) })),
    { text: t("cancel"), style: "cancel" },
  ]);
}
