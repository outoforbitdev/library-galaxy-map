import { describe, expect, it } from "vitest";
import * as pkg from "./index";
// Type-only import: every public type must be exported from the package root.
// Checked by `npm run typecheck`, erased at runtime.
import type {
  EntityKind,
  IBounds,
  ICanvasContext,
  ICanvasHandle,
  ICanvasProps,
  IEntityRef,
  IGalaxyMapHandle,
  IGalaxyMapProps,
  ILaneSegment,
  IPadding,
  IPoint,
  ISize,
  ISpacelane,
  ISystem,
  IViewport,
  IViewportChangeInfo,
  MapEntityEvent,
  YAxis,
} from "./index";

type _ExportSurfaceCheck = [
  EntityKind,
  IBounds,
  ICanvasContext,
  ICanvasHandle,
  ICanvasProps,
  IEntityRef,
  IGalaxyMapHandle,
  IGalaxyMapProps,
  ILaneSegment,
  IPadding,
  IPoint,
  ISize,
  ISpacelane,
  ISystem,
  IViewport,
  IViewportChangeInfo,
  MapEntityEvent,
  YAxis,
];

describe("package root exports", () => {
  it("exports the atlas-phase API", () => {
    expect(Object.keys(pkg).sort()).toEqual([
      "Canvas",
      "GalaxyMap",
      "SpacelaneSegment",
      "SystemGlyph",
      "fitViewport",
      "screenSpaceClassName",
      "useCanvas",
    ]);
  });

  it("has no default export and no v0 exports", () => {
    expect("default" in pkg).toBe(false);
    expect("MapColor" in pkg).toBe(false);
  });
});
