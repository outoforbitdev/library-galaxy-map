import { IMapCoordinate, IMapDimensions } from "../types";

/**
 * The visible region of the map in map coordinates.
 * Y increases upward (mathematical convention), so minY is the bottom of the
 * screen and maxY is the top.
 */
export interface IViewport {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Returns the midpoint of the given map dimensions.
 *
 * Used as the default `center` when no `initialCenter` is provided.
 */
export function mapCenter(dimensions: IMapDimensions): IMapCoordinate {
  return {
    x: (dimensions.min.x + dimensions.max.x) / 2,
    y: (dimensions.min.y + dimensions.max.y) / 2,
  };
}

/**
 * Computes the visible region in map coordinates for the given center, zoom
 * level, and container dimensions.
 *
 * Because map coordinates use an upward Y axis, minY corresponds to the bottom
 * of the screen and maxY to the top.
 */
export function computeViewport(
  center: IMapCoordinate,
  zoom: number,
  containerWidth: number,
  containerHeight: number,
): IViewport {
  const halfW = containerWidth / 2 / zoom;
  const halfH = containerHeight / 2 / zoom;
  return {
    minX: center.x - halfW,
    maxX: center.x + halfW,
    minY: center.y - halfH,
    maxY: center.y + halfH,
  };
}

/**
 * Converts a map coordinate `(mapX, mapY)` to a screen (SVG pixel) coordinate.
 *
 * The forward transform accounts for the inverted Y axis:
 *   sx =  zoom * (mapX - center.x) + svgWidth  / 2
 *   sy = -zoom * (mapY - center.y) + svgHeight / 2
 *
 * Used by `PlanetLabelLayer` to position labels in screen space.
 */
export function mapToScreen(
  mapX: number,
  mapY: number,
  center: IMapCoordinate,
  zoom: number,
  svgWidth: number,
  svgHeight: number,
): { x: number; y: number } {
  return {
    x: zoom * (mapX - center.x) + svgWidth / 2,
    y: -zoom * (mapY - center.y) + svgHeight / 2,
  };
}

/**
 * Converts a screen (SVG pixel) coordinate `(screenX, screenY)` to a map
 * coordinate.
 *
 * The inverse transform accounts for the inverted Y axis:
 *   mapX = center.x + (screenX - svgWidth  / 2) / zoom
 *   mapY = center.y - (screenY - svgHeight / 2) / zoom
 *
 * Used for zoom-to-cursor and click hit-testing.
 */
export function screenToMap(
  screenX: number,
  screenY: number,
  center: IMapCoordinate,
  zoom: number,
  svgWidth: number,
  svgHeight: number,
): IMapCoordinate {
  return {
    x: center.x + (screenX - svgWidth / 2) / zoom,
    y: center.y - (screenY - svgHeight / 2) / zoom,
  };
}
