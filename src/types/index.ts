import { ReactNode } from "react";

export enum MapColor {
  Gray,
  Red,
  Blue,
  Green,
  Yellow,
  Magenta,
  Aqua,
  Brown,
}

export interface IMapCoordinate {
  x: number;
  y: number;
}

export interface IMapDimensions {
  min: IMapCoordinate;
  max: IMapCoordinate;
}

export interface IPlanet {
  id: string;
  name: string;
  position: IMapCoordinate;
  color: MapColor;
}

export interface ISpaceLaneSegment {
  origin: IMapCoordinate;
  destination: IMapCoordinate;
  color: MapColor;
}

export interface ISpacelane {
  id: string;
  name?: string;
  segments: ISpaceLaneSegment[];
}

export interface IRenderLimits {
  planets: number;
  planetLabels: number;
  spacelanes: number;
}

export interface ILegendEntry {
  id: string;
  label: string;
  color: MapColor;
}

export interface IMapOptions {
  customOptions?: ReactNode;
}

export interface IGalaxyMapHandle {
  zoomTo(target: { coordinate: IMapCoordinate; zoom?: number }): void;
}
