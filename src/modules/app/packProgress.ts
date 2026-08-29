import type { CityProgress } from "../../core/types";

export function mergePackProgress(
  current: readonly CityProgress[],
  changed: readonly CityProgress[],
): readonly CityProgress[] {
  const merged = new Map(current.map((item) => [key(item), item]));
  changed.forEach((item) => merged.set(key(item), item));
  return [...merged.values()].sort((a, b) => a.cityId.localeCompare(b.cityId));
}

const key = (item: CityProgress) => `${item.cityId}:${item.regionVersion}`;
