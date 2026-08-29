import { describe, expect, it } from "vitest";
import type { CityProgress } from "../../core/types";
import { mergePackProgress } from "./packProgress";

const progress = (cityId: string, regionVersion: string, percent: number): CityProgress => ({
  cityId, regionVersion, percent, completedEdges: percent, eligibleEdges: 100, excludedEdges: 0,
});

describe("pack progress", () => {
  it("keeps inactive package progress when active progress changes", () => {
    const merged = mergePackProgress(
      [progress("ann-arbor", "v1", 12), progress("ypsilanti", "v1", 25)],
      [progress("ypsilanti", "v1", 30)],
    );
    expect(merged.map(({ cityId, percent }) => [cityId, percent])).toEqual([
      ["ann-arbor", 12], ["ypsilanti", 30],
    ]);
  });

  it("keeps progress for separately versioned packages", () => {
    expect(mergePackProgress([progress("area", "v1", 10)], [progress("area", "v2", 2)])).toHaveLength(2);
  });
});
