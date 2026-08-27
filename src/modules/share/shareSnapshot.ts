import type { CityProgress } from "../../core/types";
import type { MapContent } from "../app/runtimeTypes";

export function withoutRawTrack(map: MapContent): MapContent {
  return { ...map, history: undefined };
}

export function shareCaption(cityName: string, progress?: CityProgress) {
  return {
    cityName,
    percent: progress?.percent ?? 0,
    attribution: "© OpenStreetMap contributors",
  };
}
