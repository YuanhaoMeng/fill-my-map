const COMPLETION_THRESHOLD = 0.8;

export function edgeIsComplete(visitedSamples: number, totalSamples: number) {
  return totalSamples > 0 && visitedSamples / totalSamples >= COMPLETION_THRESHOLD;
}

export function progressPercent(completedEdges: number, eligibleEdges: number) {
  if (eligibleEdges <= 0) return 0;
  return Math.min(100, Math.max(0, (completedEdges / eligibleEdges) * 100));
}
