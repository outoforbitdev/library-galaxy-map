import { useCallback, useEffect, useRef, useState } from "react";
import { nearestSegmentId } from "./lanePaths";
import type { IEntityRef, IPoint, MapEntityEvent } from "./types";
import type { IMapData } from "./useMapData";

export interface IUseSelectionOptions<TSystemData, TLaneData> {
  data: IMapData<TSystemData, TLaneData>;
  selected?: IEntityRef | null;
  defaultSelected?: IEntityRef | null;
  onSelect?: (event: MapEntityEvent<TSystemData, TLaneData> | null) => void;
  onHover?: (event: MapEntityEvent<TSystemData, TLaneData> | null) => void;
}

export interface ISelectionState {
  selected: IEntityRef | null;
  hovered: IEntityRef | null;
  /** Selects an entity, or clears with null. `point` is the world position of a lane click. */
  select(ref: IEntityRef | null, point?: IPoint): void;
  hover(ref: IEntityRef | null): void;
}

/** Builds the event for an entity, or null when its id is not in the data. */
export function toEntityEvent<TSystemData, TLaneData>(
  data: IMapData<TSystemData, TLaneData>,
  ref: IEntityRef,
  point?: IPoint,
): MapEntityEvent<TSystemData, TLaneData> | null {
  if (ref.kind === "system") {
    const index = data.systemById.get(ref.id);
    return index === undefined
      ? null
      : { kind: "system", id: ref.id, system: data.systems[index] };
  }
  const index = data.laneById.get(ref.id);
  if (index === undefined) return null;
  const lane = data.lanes[index];
  return {
    kind: "lane",
    id: ref.id,
    lane,
    segmentId: point
      ? nearestSegmentId(lane, point)
      : (lane.segments[0]?.id ?? ""),
  };
}

function sameRef(a: IEntityRef | null, b: IEntityRef | null): boolean {
  return (
    a === b || (a !== null && b !== null && a.kind === b.kind && a.id === b.id)
  );
}

function exists(data: IMapData<unknown, unknown>, ref: IEntityRef): boolean {
  return (ref.kind === "system" ? data.systemById : data.laneById).has(ref.id);
}

/** Selection (controlled or uncontrolled) and hover, cleared when their entity leaves the data. */
export function useSelection<TSystemData, TLaneData>(
  options: IUseSelectionOptions<TSystemData, TLaneData>,
): ISelectionState {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const [uncontrolled, setUncontrolled] = useState<IEntityRef | null>(
    options.defaultSelected ?? null,
  );
  const [hovered, setHovered] = useState<IEntityRef | null>(null);
  const hoveredRef = useRef(hovered);
  hoveredRef.current = hovered;
  const controlled = options.selected !== undefined;
  const selected = controlled ? (options.selected ?? null) : uncontrolled;

  const select = useCallback((ref: IEntityRef | null, point?: IPoint) => {
    const { data, onSelect, selected: controlledValue } = optionsRef.current;
    const event = ref ? toEntityEvent(data, ref, point) : null;
    if (ref && !event) return;
    if (controlledValue === undefined) setUncontrolled(ref);
    onSelect?.(event);
  }, []);

  const hover = useCallback((ref: IEntityRef | null) => {
    if (sameRef(ref, hoveredRef.current)) return;
    const { data, onHover } = optionsRef.current;
    const event = ref ? toEntityEvent(data, ref) : null;
    if (ref && !event) return;
    hoveredRef.current = ref;
    setHovered(ref);
    onHover?.(event);
  }, []);

  useEffect(() => {
    const { data, onSelect, onHover } = optionsRef.current;
    if (selected && !exists(data as IMapData<unknown, unknown>, selected)) {
      if (!controlled) setUncontrolled(null);
      onSelect?.(null);
    }
    if (
      hoveredRef.current &&
      !exists(data as IMapData<unknown, unknown>, hoveredRef.current)
    ) {
      hoveredRef.current = null;
      setHovered(null);
      onHover?.(null);
    }
    // Runs when the data changes, not when the selection does.
  }, [options.data]);

  return { selected, hovered, select, hover };
}
