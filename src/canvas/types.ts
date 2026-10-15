/** A point in world or screen coordinates. */
export interface IPoint {
  x: number;
  y: number;
}

/** An axis-aligned rectangle, given by its minimum and maximum corners. */
export interface IBounds {
  min: IPoint;
  max: IPoint;
}

/**
 * A camera position. `zoom` is in screen pixels per world unit, so the same
 * viewport shows the same level of detail on every screen size.
 */
export interface IViewport {
  center: IPoint;
  zoom: number;
}

/** Space, in screen pixels, to keep clear on each side when framing. */
export interface IPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** A container size in screen pixels. */
export interface ISize {
  width: number;
  height: number;
}

/** Direction of positive y in world coordinates. */
export type YAxis = "up" | "down";
