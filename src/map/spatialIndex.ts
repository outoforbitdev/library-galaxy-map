import { INDEX_CELLS_PER_AXIS } from "./constants";
import type {
  IBounds,
  ILaneSegment,
  IPoint,
  ISpacelane,
  ISystem,
} from "./types";

/**
 * A uniform grid over world space. Each cell lists the array indexes of the
 * items that touch it. Indexes are priorities, so query results sort by priority.
 */
export interface IGridIndex {
  cellSize: number;
  minCellX: number;
  minCellY: number;
  maxCellX: number;
  maxCellY: number;
  cells: Map<string, number[]>;
}

export function isFinitePoint(point: IPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

export function isFiniteSegment(segment: ILaneSegment): boolean {
  return isFinitePoint(segment.origin) && isFinitePoint(segment.destination);
}

function boundsOf(points: IPoint[]): IBounds | null {
  const finite = points.filter(isFinitePoint);
  if (finite.length === 0) return null;
  const xs = finite.map((p) => p.x);
  const ys = finite.map((p) => p.y);
  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  };
}

function segmentBox(segment: ILaneSegment): IBounds {
  return {
    min: {
      x: Math.min(segment.origin.x, segment.destination.x),
      y: Math.min(segment.origin.y, segment.destination.y),
    },
    max: {
      x: Math.max(segment.origin.x, segment.destination.x),
      y: Math.max(segment.origin.y, segment.destination.y),
    },
  };
}

function createIndex(extent: IBounds | null): IGridIndex {
  const span = extent
    ? Math.max(extent.max.x - extent.min.x, extent.max.y - extent.min.y)
    : 0;
  return {
    cellSize: span > 0 ? span / INDEX_CELLS_PER_AXIS : 1,
    minCellX: Infinity,
    minCellY: Infinity,
    maxCellX: -Infinity,
    maxCellY: -Infinity,
    cells: new Map(),
  };
}

function addBox(index: IGridIndex, box: IBounds, item: number): void {
  const x0 = Math.floor(box.min.x / index.cellSize);
  const x1 = Math.floor(box.max.x / index.cellSize);
  const y0 = Math.floor(box.min.y / index.cellSize);
  const y1 = Math.floor(box.max.y / index.cellSize);
  for (let cx = x0; cx <= x1; cx++) {
    for (let cy = y0; cy <= y1; cy++) {
      const key = `${cx},${cy}`;
      const list = index.cells.get(key);
      if (list) list.push(item);
      else index.cells.set(key, [item]);
    }
  }
  index.minCellX = Math.min(index.minCellX, x0);
  index.minCellY = Math.min(index.minCellY, y0);
  index.maxCellX = Math.max(index.maxCellX, x1);
  index.maxCellY = Math.max(index.maxCellY, y1);
}

/** Indexes systems by position. Systems with non-finite positions are left out. */
export function buildSystemIndex(systems: readonly ISystem[]): IGridIndex {
  const index = createIndex(boundsOf(systems.map((s) => s.position)));
  systems.forEach((system, i) => {
    if (isFinitePoint(system.position))
      addBox(index, { min: system.position, max: system.position }, i);
  });
  return index;
}

/** Indexes lanes by the bounding box of each finite segment. */
export function buildLaneIndex(lanes: readonly ISpacelane[]): IGridIndex {
  const points = lanes.flatMap((lane) =>
    lane.segments.flatMap((s) => [s.origin, s.destination]),
  );
  const index = createIndex(boundsOf(points));
  lanes.forEach((lane, i) => {
    lane.segments.forEach((segment) => {
      if (isFiniteSegment(segment)) addBox(index, segmentBox(segment), i);
    });
  });
  return index;
}

/** Array indexes of items in cells overlapping `rect`, deduplicated, in priority order. */
export function queryIndex(index: IGridIndex, rect: IBounds): number[] {
  const x0 = Math.max(index.minCellX, Math.floor(rect.min.x / index.cellSize));
  const x1 = Math.min(index.maxCellX, Math.floor(rect.max.x / index.cellSize));
  const y0 = Math.max(index.minCellY, Math.floor(rect.min.y / index.cellSize));
  const y1 = Math.min(index.maxCellY, Math.floor(rect.max.y / index.cellSize));
  const found = new Set<number>();
  for (let cx = x0; cx <= x1; cx++) {
    for (let cy = y0; cy <= y1; cy++) {
      index.cells.get(`${cx},${cy}`)?.forEach((item) => found.add(item));
    }
  }
  return Array.from(found).sort((a, b) => a - b);
}

function samePoint(a: IPoint, b: IPoint): boolean {
  return a.x === b.x && a.y === b.y;
}

/** True when ids, order, or positions differ. Color, name, class, and data are ignored. */
export function systemGeometryChanged(
  previous: readonly ISystem[] | null,
  next: readonly ISystem[],
): boolean {
  if (!previous || previous.length !== next.length) return true;
  return next.some((system, i) => {
    const before = previous[i];
    return (
      before !== system &&
      (before.id !== system.id || !samePoint(before.position, system.position))
    );
  });
}

/** True when lane ids, order, or segment points differ. Colors are ignored. */
export function laneGeometryChanged(
  previous: readonly ISpacelane[] | null,
  next: readonly ISpacelane[],
): boolean {
  if (!previous || previous.length !== next.length) return true;
  return next.some((lane, i) => {
    const before = previous[i];
    if (before === lane) return false;
    if (
      before.id !== lane.id ||
      before.segments.length !== lane.segments.length
    )
      return true;
    return lane.segments.some(
      (segment, j) =>
        !samePoint(segment.origin, before.segments[j].origin) ||
        !samePoint(segment.destination, before.segments[j].destination),
    );
  });
}

/** The bounding box of every finite system position and lane point, or null when there are none. */
export function dataBounds(
  systems: readonly ISystem[],
  lanes: readonly ISpacelane[],
): IBounds | null {
  return boundsOf([
    ...systems.map((s) => s.position),
    ...lanes.flatMap((lane) =>
      lane.segments.flatMap((s) => [s.origin, s.destination]),
    ),
  ]);
}
