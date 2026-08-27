import type { CoverageVisualState } from "../../core/types";

export function visualState(flags: Set<string>): CoverageVisualState {
  if (flags.has("excluded")) return "excluded";
  if (flags.has("explored")) return "explored";
  return "unvisited";
}
