import { BOUNDS_VIEW_MARGIN, DEFAULT_ZOOM } from "./constants";
import type {
  IBounds,
  IPadding,
  IPoint,
  ISize,
  IViewport,
  YAxis,
} from "./types";

/** Zoom and pan limits. Bounds describe the content area. */
export interface ILimits {
  bounds?: IBounds;
  minZoom?: number;
  maxZoom?: number;
}

/** Options for fitting points into view. */
export interface IFitOptions extends ILimits {
  padding?: number | IPadding;
  yAxis?: YAxis;
}

/** Screen direction of world +y: -1 when world y points up, 1 when it points down. */
export function ySign(yAxis: YAxis): 1 | -1 {
  return yAxis === "up" ? -1 : 1;
}

/** Converts a world point to pixels relative to the container's top-left corner. */
export function worldToScreen(
  point: IPoint,
  viewport: IViewport,
  size: ISize,
  yAxis: YAxis,
): IPoint {
  return {
    x: size.width / 2 + viewport.zoom * (point.x - viewport.center.x),
    y:
      size.height / 2 +
      ySign(yAxis) * viewport.zoom * (point.y - viewport.center.y),
  };
}

/** Converts pixels relative to the container's top-left corner to a world point. */
export function screenToWorld(
  point: IPoint,
  viewport: IViewport,
  size: ISize,
  yAxis: YAxis,
): IPoint {
  return {
    x: viewport.center.x + (point.x - size.width / 2) / viewport.zoom,
    y:
      viewport.center.y +
      (ySign(yAxis) * (point.y - size.height / 2)) / viewport.zoom,
  };
}

/** The SVG transform for the world group: world coordinates in, screen pixels out. */
export function worldTransform(
  viewport: IViewport,
  size: ISize,
  yAxis: YAxis,
): string {
  const sign = ySign(yAxis);
  const zoom = viewport.zoom;
  const tx = size.width / 2 - zoom * viewport.center.x;
  const ty = size.height / 2 - sign * zoom * viewport.center.y;
  return `matrix(${zoom} 0 0 ${sign * zoom} ${tx} ${ty})`;
}

/**
 * The world area on screen, plus `margin` (a fraction of the view) on each
 * side. Always returned with min below max, whichever way y points.
 */
export function visibleWorldRect(
  viewport: IViewport,
  size: ISize,
  margin = 0,
): IBounds {
  const halfWidth = (size.width / 2 / viewport.zoom) * (1 + 2 * margin);
  const halfHeight = (size.height / 2 / viewport.zoom) * (1 + 2 * margin);
  return {
    min: {
      x: viewport.center.x - halfWidth,
      y: viewport.center.y - halfHeight,
    },
    max: {
      x: viewport.center.x + halfWidth,
      y: viewport.center.y + halfHeight,
    },
  };
}

function clampAxis(
  value: number,
  low: number,
  high: number,
  current?: number,
): number {
  const lo = current === undefined ? low : Math.min(low, current);
  const hi = current === undefined ? high : Math.max(high, current);
  return Math.min(hi, Math.max(lo, value));
}

/**
 * Clamps a target viewport to the limits. The center may move up to half a
 * view beyond the bounds. When `current` is given, the limits are expanded to
 * include it, so clamping never moves a camera that is already outside them:
 * it can move back toward the limits but not further away.
 */
export function clampViewport(
  target: IViewport,
  limits: ILimits,
  size: ISize,
  current?: IViewport,
): IViewport {
  const zoom = clampAxis(
    target.zoom,
    limits.minZoom ?? 0,
    limits.maxZoom ?? Infinity,
    current?.zoom,
  );
  const { bounds } = limits;
  if (!bounds || size.width <= 0 || size.height <= 0) {
    return { center: target.center, zoom };
  }
  const marginX = (size.width * BOUNDS_VIEW_MARGIN) / zoom;
  const marginY = (size.height * BOUNDS_VIEW_MARGIN) / zoom;
  return {
    zoom,
    center: {
      x: clampAxis(
        target.center.x,
        bounds.min.x - marginX,
        bounds.max.x + marginX,
        current?.center.x,
      ),
      y: clampAxis(
        target.center.y,
        bounds.min.y - marginY,
        bounds.max.y + marginY,
        current?.center.y,
      ),
    },
  };
}

/** Expands a single padding number to all four sides. */
export function normalizePadding(padding?: number | IPadding): IPadding {
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return padding ?? { top: 0, right: 0, bottom: 0, left: 0 };
}

/**
 * The smallest viewport that shows every point inside the padding, clamped to
 * the limits. Returns null when there are no points or no size. A single point
 * is shown at `maxZoom`, or `DEFAULT_ZOOM` when there is none.
 */
export function fitViewport(
  points: IPoint[],
  size: ISize,
  options: IFitOptions = {},
): IViewport | null {
  if (points.length === 0 || size.width <= 0 || size.height <= 0) return null;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padding = normalizePadding(options.padding);
  const availableWidth = Math.max(1, size.width - padding.left - padding.right);
  const availableHeight = Math.max(
    1,
    size.height - padding.top - padding.bottom,
  );
  let zoom = Math.min(
    maxX > minX ? availableWidth / (maxX - minX) : Infinity,
    maxY > minY ? availableHeight / (maxY - minY) : Infinity,
  );
  if (!Number.isFinite(zoom)) zoom = options.maxZoom ?? DEFAULT_ZOOM;
  zoom = Math.min(
    options.maxZoom ?? Infinity,
    Math.max(options.minZoom ?? 0, zoom),
  );
  const sign = ySign(options.yAxis ?? "down");
  const center = {
    x: (minX + maxX) / 2 - (padding.left - padding.right) / (2 * zoom),
    y: (minY + maxY) / 2 - (sign * (padding.top - padding.bottom)) / (2 * zoom),
  };
  return clampViewport({ center, zoom }, options, size);
}

/** Interpolates the center linearly and the zoom on a log scale. */
export function interpolateViewport(
  from: IViewport,
  to: IViewport,
  t: number,
): IViewport {
  return {
    center: {
      x: from.center.x + (to.center.x - from.center.x) * t,
      y: from.center.y + (to.center.y - from.center.y) * t,
    },
    zoom: from.zoom * Math.pow(to.zoom / from.zoom, t),
  };
}

/** Cubic ease-in-out for camera animations. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
