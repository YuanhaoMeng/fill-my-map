import { Alert } from "react-native";
import type { ExclusionReason, TravelMode } from "../core/types";
import type { MessageKey } from "../i18n/messages";

type Translate = (key: MessageKey) => string;

export function promptExclusion(
  edgeId: string,
  state: string,
  t: Translate,
  exclude: (edgeId: string, mode: TravelMode, reason: ExclusionReason) => Promise<void>,
  undo: (edgeId: string, mode: TravelMode) => Promise<void>,
) {
  if (state === "excluded") {
    Alert.alert(t("restoreRoad"), t("chooseMode"), [
      { text: t("walk"), onPress: () => void undo(edgeId, "walk") },
      { text: t("drive"), onPress: () => void undo(edgeId, "drive") },
      { text: t("cancel"), style: "cancel" },
    ]);
    return;
  }
  Alert.alert(t("excludeRoad"), t("chooseMode"), [
    { text: t("walk"), onPress: () => chooseReason(edgeId, "walk", t, exclude) },
    { text: t("drive"), onPress: () => chooseReason(edgeId, "drive", t, exclude) },
    { text: t("cancel"), style: "cancel" },
  ]);
}

function chooseReason(
  edgeId: string,
  mode: TravelMode,
  t: Translate,
  exclude: (edgeId: string, mode: TravelMode, reason: ExclusionReason) => Promise<void>,
) {
  const reasons: readonly [ExclusionReason, MessageKey][] = [
    ["private", "privateRoad"],
    ["closed", "closedRoad"],
    ["unsafe", "unsafeRoad"],
    ["map_error", "mapError"],
    ["other", "other"],
  ];
  Alert.alert(t("excludeReason"), undefined, [
    ...reasons.map(([reason, label]) => ({ text: t(label), onPress: () => void exclude(edgeId, mode, reason) })),
    { text: t("cancel"), style: "cancel" },
  ]);
}
