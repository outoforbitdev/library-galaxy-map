import { visibleWorldRect, worldToScreen } from "../canvas/projection";
import type { ISize, IViewport } from "../canvas/types";
import {
  COLLISION_CELL_PX,
  CULL_MARGIN,
  GLYPH_RADIUS_PX,
  GLYPH_SPACING_PX,
  LABEL_HEIGHT_PX,
  LABEL_OFFSET_PX,
  MAP_Y_AXIS,
} from "./constants";
import type { MeasureText } from "./measure";
import {
  type IGridIndex,
  isFinitePoint,
  isFiniteSegment,
  queryIndex,
} from "./spatialIndex";
import type {
  IBounds,
  IEntityRef,
  ILaneSegment,
  IPoint,
  ISpacelane,
  ISystem,
} from "./types";

export interface ICullLimits {
  maxSystems: number;
  maxLabels: number;
  maxLaneSegments: number;
}

export interface ICullInput {
  systems: readonly ISystem[];
  lanes: readonly ISpacelane[];
  systemIndex: IGridIndex;
  laneIndex: IGridIndex;
  viewport: IViewport;
  size: ISize;
  selected: IEntityRef | null;
  limits: ICullLimits;
  /** False draws everything, labeled, with no viewport query, collisions, or limits. */
  enabled: boolean;
  measure: MeasureText;
}

export interface ICulledSystem {
  index: number;
  labeled: boolean;
}

/** What to draw, each list in priority order, highest first. */
export interface ICullResult {
  systems: ICulledSystem[];
  lanes: number[];
}

interface IBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function overlaps(a: IBox, b: IBox): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

/** Placed screen boxes, bucketed so collision checks only look nearby. */
class BoxHash {
  private cells = new Map<string, IBox[]>();

  private keys(box: IBox): string[] {
    const keys: string[] = [];
    for (
      let cx = Math.floor(box.x / COLLISION_CELL_PX);
      cx <= Math.floor((box.x + box.w) / COLLISION_CELL_PX);
      cx++
    ) {
      for (
        let cy = Math.floor(box.y / COLLISION_CELL_PX);
        cy <= Math.floor((box.y + box.h) / COLLISION_CELL_PX);
        cy++
      ) {
        keys.push(`${cx},${cy}`);
      }
    }
    return keys;
  }

  collides(box: IBox): boolean {
    return this.keys(box).some((key) =>
      (this.cells.get(key) ?? []).some((other) => overlaps(box, other)),
    );
  }

  add(box: IBox): void {
    this.keys(box).forEach((key) => {
      const list = this.cells.get(key);
      if (list) list.push(box);
      else this.cells.set(key, [box]);
    });
  }
}

function inRect(point: IPoint, rect: IBounds): boolean {
  return (
    point.x >= rect.min.x &&
    point.x <= rect.max.x &&
    point.y >= rect.min.y &&
    point.y <= rect.max.y
  );
}

function segmentTouchesRect(segment: ILaneSegment, rect: IBounds): boolean {
  return (
    Math.max(segment.origin.x, segment.destination.x) >= rect.min.x &&
    Math.min(segment.origin.x, segment.destination.x) <= rect.max.x &&
    Math.max(segment.origin.y, segment.destination.y) >= rect.min.y &&
    Math.min(segment.origin.y, segment.destination.y) <= rect.max.y
  );
}

function withFirst(indexes: number[], first: number): number[] {
  return first < 0 ? indexes : [first, ...indexes.filter((i) => i !== first)];
}

function cullSystems(input: ICullInput, selected: number): ICulledSystem[] {
  const valid = (i: number) => isFinitePoint(input.systems[i].position);
  if (!input.enabled) {
    return withFirst(
      input.systems.map((_, i) => i),
      selected,
    )
      .filter(valid)
      .map((index) => ({ index, labeled: true }));
  }
  const rect = visibleWorldRect(input.viewport, input.size, CULL_MARGIN);
  const candidates = withFirst(
    queryIndex(input.systemIndex, rect).filter((i) =>
      inRect(input.systems[i].position, rect),
    ),
    selected,
  ).filter(valid);

  const placed = new BoxHash();
  const result: ICulledSystem[] = [];
  const half = GLYPH_RADIUS_PX + GLYPH_SPACING_PX / 2;
  let labels = 0;
  for (const index of candidates) {
    if (result.length >= input.limits.maxSystems) break;
    const system = input.systems[index];
    const point = worldToScreen(
      system.position,
      input.viewport,
      input.size,
      MAP_Y_AXIS,
    );
    const glyph = {
      x: point.x - half,
      y: point.y - half,
      w: 2 * half,
      h: 2 * half,
    };
    const forced = index === selected;
    if (!forced && placed.collides(glyph)) continue;
    placed.add(glyph);
    const label = {
      x: point.x + LABEL_OFFSET_PX,
      y: point.y - LABEL_HEIGHT_PX / 2,
      w: input.measure(system.name),
      h: LABEL_HEIGHT_PX,
    };
    const labeled =
      forced || (labels < input.limits.maxLabels && !placed.collides(label));
    if (labeled) {
      placed.add(label);
      labels++;
    }
    result.push({ index, labeled });
  }
  return result;
}

function cullLanes(input: ICullInput, selected: number): number[] {
  if (!input.enabled)
    return withFirst(
      input.lanes.map((_, i) => i),
      selected,
    );
  const rect = visibleWorldRect(input.viewport, input.size, CULL_MARGIN);
  const result: number[] = [];
  let segments = 0;
  for (const index of withFirst(queryIndex(input.laneIndex, rect), selected)) {
    const visible = input.lanes[index].segments.filter(
      (s) => isFiniteSegment(s) && segmentTouchesRect(s, rect),
    ).length;
    if (index !== selected) {
      if (visible === 0) continue;
      if (segments + visible > input.limits.maxLaneSegments) break;
    }
    result.push(index);
    segments += visible;
  }
  return result;
}

/**
 * Decides what to draw. Systems are walked greedily in priority order, with the
 * selected system first: a glyph that collides with anything placed is hidden,
 * and a placed glyph gets its label if the label box is clear. Lanes are kept
 * in priority order, with the selected lane first, until the segment budget.
 */
export function cull(input: ICullInput): ICullResult {
  const selectedSystem =
    input.selected?.kind === "system"
      ? input.systems.findIndex((s) => s.id === input.selected!.id)
      : -1;
  const selectedLane =
    input.selected?.kind === "lane"
      ? input.lanes.findIndex((l) => l.id === input.selected!.id)
      : -1;
  return {
    systems: cullSystems(input, selectedSystem),
    lanes: cullLanes(input, selectedLane),
  };
}
