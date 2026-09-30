import type { IPoint } from "../canvas/types";

export type {
  IBounds,
  IPadding,
  IPoint,
  ISize,
  IViewport,
} from "../canvas/types";

/** A star system. Array order in `systems` is priority, highest first. */
export interface ISystem<TData = unknown> {
  /** Unique among systems. */
  id: string;
  /** The label, when shown, and always the accessible name. */
  name: string;
  /** World coordinates, with positive y up. */
  position: IPoint;
  /** Any valid CSS color, used as the glyph fill. */
  color: string;
  /** Optional class on the system's group, for styling beyond color. */
  className?: string;
  /** Consumer data, returned in events and overlay rendering. Never read by the map. */
  data?: TData;
}

/** One straight piece of a spacelane. */
export interface ILaneSegment {
  /** Unique among segments. */
  id: string;
  origin: IPoint;
  destination: IPoint;
  /** Any valid CSS color, used as the stroke. */
  color: string;
}

/** A spacelane. Array order in `spacelanes` is priority, highest first. */
export interface ISpacelane<TData = unknown> {
  /** Unique among spacelanes. May equal a system id. */
  id: string;
  name: string;
  segments: ILaneSegment[];
  className?: string;
  data?: TData;
}

export type EntityKind = "system" | "lane";

/** Identifies a system or lane. */
export interface IEntityRef {
  kind: EntityKind;
  id: string;
}

/** Passed to onSelect and onHover. Narrow on `kind` for a typed entity. */
export type MapEntityEvent<TSystemData = unknown, TLaneData = unknown> =
  | { kind: "system"; id: string; system: ISystem<TSystemData> }
  | {
      kind: "lane";
      id: string;
      lane: ISpacelane<TLaneData>;
      segmentId: string;
    };
