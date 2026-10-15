import { useEffect, useMemo, useRef } from "react";
import { EMPTY_BOUNDS_HALF_SIZE } from "./constants";
import {
  buildLaneIndex,
  buildSystemIndex,
  dataBounds,
  type IGridIndex,
  laneGeometryChanged,
  systemGeometryChanged,
} from "./spatialIndex";
import type { IBounds, ISpacelane, ISystem } from "./types";
import { findDataProblems, isDevelopment } from "./validate";

/** Everything derived from the consumer's data. */
export interface IMapData<TSystemData = unknown, TLaneData = unknown> {
  systems: readonly ISystem<TSystemData>[];
  lanes: readonly ISpacelane<TLaneData>[];
  systemIndex: IGridIndex;
  laneIndex: IGridIndex;
  systemById: Map<string, number>;
  laneById: Map<string, number>;
  /** The data's bounding box, or a small box around the origin when there is no data. */
  bounds: IBounds;
}

const EMPTY_BOUNDS: IBounds = {
  min: { x: -EMPTY_BOUNDS_HALF_SIZE, y: -EMPTY_BOUNDS_HALF_SIZE },
  max: { x: EMPTY_BOUNDS_HALF_SIZE, y: EMPTY_BOUNDS_HALF_SIZE },
};

function boundsEqual(a: IBounds, b: IBounds): boolean {
  return (
    a.min.x === b.min.x &&
    a.min.y === b.min.y &&
    a.max.x === b.max.x &&
    a.max.y === b.max.y
  );
}

/**
 * Derives indexes, lookups, and bounds. Each spatial index is rebuilt only when
 * its geometry (ids, order, positions) changes, so recoloring never rebuilds it.
 */
export function useMapData<TSystemData, TLaneData>(
  systems: readonly ISystem<TSystemData>[],
  lanes: readonly ISpacelane<TLaneData>[],
): IMapData<TSystemData, TLaneData> {
  const systemCache = useRef<{
    source: readonly ISystem[];
    index: IGridIndex;
  } | null>(null);
  const laneCache = useRef<{
    source: readonly ISpacelane[];
    index: IGridIndex;
  } | null>(null);
  const boundsCache = useRef<IBounds | null>(null);
  const warned = useRef(new Set<string>());

  const systemIndex = useMemo(() => {
    const cached = systemCache.current;
    if (cached && !systemGeometryChanged(cached.source, systems)) {
      cached.source = systems;
      return cached.index;
    }
    const index = buildSystemIndex(systems);
    systemCache.current = { source: systems, index };
    return index;
  }, [systems]);

  const laneIndex = useMemo(() => {
    const cached = laneCache.current;
    if (cached && !laneGeometryChanged(cached.source, lanes)) {
      cached.source = lanes;
      return cached.index;
    }
    const index = buildLaneIndex(lanes);
    laneCache.current = { source: lanes, index };
    return index;
  }, [lanes]);

  const bounds = useMemo(() => {
    const next = dataBounds(systems, lanes) ?? EMPTY_BOUNDS;
    const previous = boundsCache.current;
    if (previous && boundsEqual(previous, next)) return previous;
    boundsCache.current = next;
    return next;
    // Bounds only change when geometry changes, which is when an index changes.
  }, [systemIndex, laneIndex]);

  const systemById = useMemo(
    () => new Map(systems.map((s, i) => [s.id, i])),
    [systems],
  );
  const laneById = useMemo(
    () => new Map(lanes.map((l, i) => [l.id, i])),
    [lanes],
  );

  useEffect(() => {
    if (!isDevelopment()) return;
    findDataProblems(systems, lanes).forEach((problem) => {
      if (warned.current.has(problem)) return;
      warned.current.add(problem);
      console.warn(`[galaxy-map] ${problem}`);
    });
  }, [systems, lanes]);

  return useMemo(
    () => ({
      systems,
      lanes,
      systemIndex,
      laneIndex,
      systemById,
      laneById,
      bounds,
    }),
    [systems, lanes, systemIndex, laneIndex, systemById, laneById, bounds],
  );
}
