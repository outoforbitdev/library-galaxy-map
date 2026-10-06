import { createContext, useContext } from "react";
import type { IPoint, ISize, IViewport, YAxis } from "./types";

/** What content inside a Canvas can read. */
export interface ICanvasContext {
  /** The published viewport: throttled during movement, exact when settled. */
  viewport: IViewport;
  size: ISize;
  yAxis: YAxis;
  /** Whether a pointer gesture is in progress. */
  gesturing: boolean;
  /** Converts a world point to container pixels using the live camera. */
  worldToScreen(point: IPoint): IPoint;
  /** Converts container pixels to a world point using the live camera. */
  screenToWorld(point: IPoint): IPoint;
}

export const CanvasContext = createContext<ICanvasContext | null>(null);

/** Reads the enclosing Canvas. Throws when used outside one. */
export function useCanvas(): ICanvasContext {
  const context = useContext(CanvasContext);
  if (!context) throw new Error("useCanvas must be used inside a <Canvas>.");
  return context;
}
