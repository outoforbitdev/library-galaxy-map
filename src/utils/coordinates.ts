import { IMapCoordinate, IMapDimensions } from "../types";

export interface IViewport {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function mapCenter(dimensions: IMapDimensions): IMapCoordinate {
  return {
    x: (dimensions.min.x + dimensions.max.x) / 2,
    y: (dimensions.min.y + dimensions.max.y) / 2,
  };
}

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
    minY: center.y - halfH,
    maxX: center.x + halfW,
    maxY: center.y + halfH,
  };
}
