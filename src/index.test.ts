import { describe, it, expect } from "vitest";
import * as pkg from "./index";
// Type-only import: verifies every public type is exported from the package
// root without needing an internal path. Checked by `tsc --noEmit`; erased
// at runtime so it has no effect on the tests below.
import type {
  IGalaxyMapHandle,
  IPlanet,
  ISpacelane,
  ISpaceLaneSegment,
  IMapCoordinate,
  IMapDimensions,
  IRenderLimits,
  ILegendEntry,
  IMapOptions,
} from "./index";

type _ExportSurfaceCheck = [
  IGalaxyMapHandle,
  IPlanet,
  ISpacelane,
  ISpaceLaneSegment,
  IMapCoordinate,
  IMapDimensions,
  IRenderLimits,
  ILegendEntry,
  IMapOptions,
];

describe("package root exports", () => {
  it("exports GalaxyMap as the default export", () => {
    expect(pkg.default).toBeDefined();
    expect(
      typeof pkg.default === "function" || typeof pkg.default === "object",
    ).toBe(true);
  });

  it("exports MapColor as a value (enum)", () => {
    expect(pkg.MapColor).toBeDefined();
    expect(pkg.MapColor.Gray).toBe(0);
  });

  it("does not export the retired FocusLevel", () => {
    expect("FocusLevel" in pkg).toBe(false);
  });
});
