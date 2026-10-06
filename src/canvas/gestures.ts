import {
  WHEEL_PAGE_HEIGHT_PX,
  DRAG_THRESHOLD_MOUSE_PX,
  DRAG_THRESHOLD_TOUCH_PX,
  KEYBOARD_PAN_FRACTION,
  KEYBOARD_ZOOM_FACTOR,
  PINCH_ZOOM_SENSITIVITY,
  WHEEL_LINE_HEIGHT_PX,
  WHEEL_ZOOM_SENSITIVITY,
} from "./constants";
import { clampZoom, screenToWorld, ySign } from "./projection";
import type { ILimits } from "./projection";
import type { IPoint, ISize, IViewport, YAxis } from "./types";

/** Zoom limits that gestures respect. */
export type ZoomLimits = Pick<ILimits, "minZoom" | "maxZoom">;

/** Whether a press has moved far enough to count as a pan rather than a click. */
export function exceedsDragThreshold(
  start: IPoint,
  current: IPoint,
  pointerType: string,
): boolean {
  const threshold =
    pointerType === "touch" ? DRAG_THRESHOLD_TOUCH_PX : DRAG_THRESHOLD_MOUSE_PX;
  return Math.hypot(current.x - start.x, current.y - start.y) > threshold;
}

/** Pans so content moves with the pointer by (dx, dy) screen pixels. */
export function panByPixels(
  viewport: IViewport,
  dx: number,
  dy: number,
  yAxis: YAxis,
): IViewport {
  return {
    zoom: viewport.zoom,
    center: {
      x: viewport.center.x - dx / viewport.zoom,
      y: viewport.center.y - (ySign(yAxis) * dy) / viewport.zoom,
    },
  };
}

/**
 * Multiplies zoom by `factor`, keeping the world point under `screenPoint` fixed.
 * With `limits`, the zoom is clamped before the center is computed, so zooming
 * against a limit does not drift the center toward the pointer.
 */
export function zoomAtPoint(
  viewport: IViewport,
  size: ISize,
  screenPoint: IPoint,
  factor: number,
  yAxis: YAxis,
  limits: ZoomLimits = {},
): IViewport {
  const anchor = screenToWorld(screenPoint, viewport, size, yAxis);
  const zoom = clampZoom(viewport.zoom * factor, limits, viewport.zoom);
  return {
    zoom,
    center: {
      x: anchor.x - (screenPoint.x - size.width / 2) / zoom,
      y: anchor.y - (ySign(yAxis) * (screenPoint.y - size.height / 2)) / zoom,
    },
  };
}

/**
 * Zoom factor for a wheel event. A wheel event with ctrlKey is a trackpad
 * pinch, which reports small deltas and gets its own sensitivity.
 */
export function wheelZoomFactor(
  deltaY: number,
  deltaMode: number,
  ctrlKey: boolean,
): number {
  const pixels =
    deltaMode === 2
      ? deltaY * WHEEL_PAGE_HEIGHT_PX
      : deltaMode === 1
        ? deltaY * WHEEL_LINE_HEIGHT_PX
        : deltaY;
  const sensitivity = ctrlKey ? PINCH_ZOOM_SENSITIVITY : WHEEL_ZOOM_SENSITIVITY;
  return Math.exp(-pixels * sensitivity);
}

function midpoint(a: IPoint, b: IPoint): IPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Applies a two-finger move: zoom by the distance change, then pan by the midpoint change. */
export function pinchUpdate(
  previous: [IPoint, IPoint],
  next: [IPoint, IPoint],
  viewport: IViewport,
  size: ISize,
  yAxis: YAxis,
  limits: ZoomLimits = {},
): IViewport {
  const previousDistance = Math.hypot(
    previous[0].x - previous[1].x,
    previous[0].y - previous[1].y,
  );
  const nextDistance = Math.hypot(next[0].x - next[1].x, next[0].y - next[1].y);
  const factor = previousDistance > 0 ? nextDistance / previousDistance : 1;
  const previousMid = midpoint(previous[0], previous[1]);
  const nextMid = midpoint(next[0], next[1]);
  const zoomed = zoomAtPoint(
    viewport,
    size,
    previousMid,
    factor,
    yAxis,
    limits,
  );
  return panByPixels(
    zoomed,
    nextMid.x - previousMid.x,
    nextMid.y - previousMid.y,
    yAxis,
  );
}

/** A keyboard camera action: pan content by pixels, or zoom by a factor. */
export type KeyAction =
  | { type: "pan"; dx: number; dy: number }
  | { type: "zoom"; factor: number };

/** Maps a key to a camera action. Arrow keys move the view in their direction. */
export function keyAction(key: string, size: ISize): KeyAction | null {
  const panX = size.width * KEYBOARD_PAN_FRACTION;
  const panY = size.height * KEYBOARD_PAN_FRACTION;
  switch (key) {
    case "ArrowLeft":
      return { type: "pan", dx: panX, dy: 0 };
    case "ArrowRight":
      return { type: "pan", dx: -panX, dy: 0 };
    case "ArrowUp":
      return { type: "pan", dx: 0, dy: panY };
    case "ArrowDown":
      return { type: "pan", dx: 0, dy: -panY };
    case "+":
    case "=":
      return { type: "zoom", factor: KEYBOARD_ZOOM_FACTOR };
    case "-":
    case "_":
      return { type: "zoom", factor: 1 / KEYBOARD_ZOOM_FACTOR };
    default:
      return null;
  }
}
