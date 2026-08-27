import { describe, expect, it } from "vitest";
import { shareCameraStop } from "./shareCamera";

describe("share screenshot camera", () => {
  it("fits the selected city bounds", () => {
    const bounds = [-83.81, 42.21, -83.665, 42.334] as const;
    expect(shareCameraStop(bounds)).toMatchObject({ bounds, duration: 500 });
  });
});
