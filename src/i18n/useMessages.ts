import { getLocales } from "expo-localization";
import { messages, type Locale, type MessageKey } from "./messages";

function systemLocale(): Locale {
  return getLocales()[0]?.languageCode === "zh" ? "zh" : "en";
}

export function useMessages() {
  const locale = systemLocale();
  return { locale, t: (key: MessageKey) => messages[locale][key] };
}
