export function shareCameraStop(bounds: readonly [number, number, number, number]) {
  return {
    bounds: [...bounds] as [number, number, number, number],
    padding: { top: 36, right: 24, bottom: 36, left: 24 },
    duration: 500,
    easing: "ease" as const,
  };
}
