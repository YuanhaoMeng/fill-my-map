import { describe, expect, it } from "vitest";
import { eligibleForProfile } from "./profile-rules.mjs";

describe("map network profiles", () => {
  it("keeps only arterial classes in an overview", () => {
    expect(eligibleForProfile({ highway: "primary" }, "arterial")).toBe(true);
    expect(eligibleForProfile({ highway: "secondary_link" }, "arterial")).toBe(true);
    expect(eligibleForProfile({ highway: "residential" }, "arterial")).toBe(false);
  });

  it("keeps public trails and rejects private paths", () => {
    expect(eligibleForProfile({ highway: "path" }, "trail")).toBe(true);
    expect(eligibleForProfile({ highway: "footway", access: "private" }, "trail")).toBe(false);
    expect(eligibleForProfile({ highway: "primary" }, "trail")).toBe(false);
  });
});
