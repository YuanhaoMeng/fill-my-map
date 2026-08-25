import type { CoverageVisualState } from "../../core/types";

export function visualState(modes: Set<string>): CoverageVisualState {
  if (modes.has("excluded")) return "excluded";
  if (modes.has("walk") && modes.has("drive")) return "both";
  if (modes.has("walk")) return "walk";
  if (modes.has("drive")) return "drive";
  return "unvisited";
}
