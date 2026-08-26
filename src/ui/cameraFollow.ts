export type CameraFollowState = "inactive" | "waiting" | "following" | "suspended";
export type CameraFollowEvent = "start" | "location" | "gesture" | "resume" | "stop";

export function nextCameraFollowState(
  state: CameraFollowState,
  event: CameraFollowEvent,
  hasLocation = false,
): CameraFollowState {
  if (event === "stop") return "inactive";
  if (event === "start") return "waiting";
  if (event === "gesture" && state !== "inactive") return "suspended";
  if (event === "resume") return hasLocation ? "following" : "waiting";
  if (event === "location" && state !== "inactive" && state !== "suspended") return "following";
  return state;
}
