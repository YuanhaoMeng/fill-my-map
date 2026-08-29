import { describe, expect, it } from "vitest";
import { catalogRows } from "./catalogRows";

describe("map catalog rows", () => {
  it("keeps a previously installed city visible after catalog migration", () => {
    const local = {
      manifest: {
        id: "ann-arbor", displayName: "Ann Arbor", version: "v1",
        sha256: { network: "a".repeat(64), basemap: "b".repeat(64) },
      },
    } as never;
    expect(catalogRows([], [local])).toMatchObject([{
      id: "ann-arbor", displayName: "Ann Arbor", kind: "city", networkProfile: "street",
    }]);
  });
});
