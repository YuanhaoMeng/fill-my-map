import { describe, expect, it } from "vitest";
import { nextCameraFollowState } from "./cameraFollow";

describe("camera follow", () => {
  it("waits for the first valid location and then follows", () => {
    const waiting = nextCameraFollowState("inactive", "start");
    expect(waiting).toBe("waiting");
    expect(nextCameraFollowState(waiting, "location")).toBe("following");
  });

  it("suspends on a manual gesture until the explicit resume action", () => {
    const suspended = nextCameraFollowState("following", "gesture");
    expect(nextCameraFollowState(suspended, "location")).toBe("suspended");
    expect(nextCameraFollowState(suspended, "resume", true)).toBe("following");
  });

  it("stops following when exploration ends", () => {
    expect(nextCameraFollowState("following", "stop")).toBe("inactive");
  });
});
