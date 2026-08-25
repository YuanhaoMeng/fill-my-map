import { describe, expect, it } from "vitest";
import { eligibleModes } from "./rules.mjs";

describe("OSM road eligibility", () => {
  it("excludes private and parking access roads", () => {
    expect(eligibleModes({ highway: "residential", access: "private" })).toEqual([]);
    expect(eligibleModes({ highway: "service", name: "Lot", service: "parking_aisle" })).toEqual([]);
  });

  it("keeps named alleys and separates modal access", () => {
    expect(eligibleModes({ highway: "service", name: "Library Lane", service: "alley" })).toEqual([
      "walk",
      "drive",
    ]);
    expect(eligibleModes({ highway: "motorway" })).toEqual(["drive"]);
    expect(eligibleModes({ highway: "pedestrian" })).toEqual(["walk"]);
  });

  it("honors explicit access exceptions", () => {
    expect(eligibleModes({ highway: "path", motor_vehicle: "yes" })).toEqual(["drive"]);
    expect(eligibleModes({ highway: "trunk", foot: "yes" })).toEqual(["walk", "drive"]);
  });
});
