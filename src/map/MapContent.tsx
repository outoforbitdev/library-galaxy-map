import {
  type PointerEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCanvas } from "../canvas/CanvasContext";
import { cull, type ICullResult } from "./cull";
import styles from "./GalaxyMap.module.css";
import { Highlight, type HighlightTarget } from "./Highlight";
import { LaneNode } from "./LaneNode";
import { createTextMeasurer, type MeasureText } from "./measure";
import { SystemLabel } from "./SystemLabel";
import { SystemNode } from "./SystemNode";
import type { EntityKind, IEntityRef, ISystem } from "./types";
import type { IMapData } from "./useMapData";

export interface IMapContentProps<TSystemData, TLaneData> {
  data: IMapData<TSystemData, TLaneData>;
  selected: IEntityRef | null;
  hovered: IEntityRef | null;
  focusedId: string | null;
  onHover: (ref: IEntityRef | null) => void;
  onCulled: (result: ICullResult) => void;
  selectionEnabled: boolean;
  hoverEnabled: boolean;
  highlightColor?: string;
  culling: boolean;
  maxSystems: number;
  maxLabels: number;
  maxLaneSegments: number;
  elementIdFor: (systemId: string) => string;
  renderSystemOverlay?: (system: ISystem<TSystemData>) => ReactNode;
  children?: ReactNode;
}

function entityOf(target: EventTarget | null): IEntityRef | null {
  const element =
    target instanceof Element ? target.closest("[data-kind]") : null;
  if (!element) return null;
  return {
    kind: element.getAttribute("data-kind") as EntityKind,
    id: element.getAttribute("data-id") ?? "",
  };
}

function highlightTarget<TS, TL>(
  data: IMapData<TS, TL>,
  ref: IEntityRef | null,
): HighlightTarget | null {
  if (!ref) return null;
  if (ref.kind === "system") {
    const index = data.systemById.get(ref.id);
    return index === undefined
      ? null
      : { kind: "system", system: data.systems[index] };
  }
  const index = data.laneById.get(ref.id);
  return index === undefined ? null : { kind: "lane", lane: data.lanes[index] };
}

/** Culls and draws the map. Must be rendered inside a Canvas. */
export function MapContent<TSystemData, TLaneData>(
  props: IMapContentProps<TSystemData, TLaneData>,
) {
  const canvas = useCanvas();
  const systemsRef = useRef<SVGGElement>(null);
  const [measure, setMeasure] = useState<MeasureText>(() =>
    createTextMeasurer(),
  );

  // Measure labels in the font the stylesheet actually applies.
  // Measure again when web fonts finish loading, since the first pass may have
  // used a fallback font.
  useLayoutEffect(() => {
    const element = systemsRef.current;
    if (!element) return;
    const remeasure = () => {
      const font = getComputedStyle(element).font;
      if (font) setMeasure(() => createTextMeasurer(font));
    };
    remeasure();
    const fonts = typeof document === "undefined" ? undefined : document.fonts;
    fonts?.addEventListener?.("loadingdone", remeasure);
    return () => fonts?.removeEventListener?.("loadingdone", remeasure);
  }, []);

  const { data, selected, culling, maxSystems, maxLabels, maxLaneSegments } =
    props;
  const result = useMemo(
    () =>
      cull({
        systems: data.systems,
        lanes: data.lanes,
        systemIndex: data.systemIndex,
        laneIndex: data.laneIndex,
        viewport: canvas.viewport,
        size: canvas.size,
        selected,
        limits: { maxSystems, maxLabels, maxLaneSegments },
        enabled: culling,
        measure,
      }),
    [
      data,
      canvas.viewport,
      canvas.size,
      selected,
      maxSystems,
      maxLabels,
      maxLaneSegments,
      culling,
      measure,
    ],
  );

  const { onCulled, onHover } = props;
  useLayoutEffect(() => onCulled(result), [onCulled, result]);

  // Hover pauses during gestures, and a gesture clears it.
  useEffect(() => {
    if (canvas.gesturing) onHover(null);
  }, [canvas.gesturing, onHover]);

  const handlePointerOver = (event: PointerEvent<SVGGElement>) => {
    if (
      !props.hoverEnabled ||
      event.pointerType === "touch" ||
      canvas.gesturing
    )
      return;
    onHover(entityOf(event.target));
  };
  const handlePointerOut = (event: PointerEvent<SVGGElement>) => {
    if (!props.hoverEnabled || event.pointerType === "touch") return;
    onHover(entityOf(event.relatedTarget));
  };

  const isSelected = (kind: EntityKind, id: string) =>
    selected?.kind === kind && selected.id === id;
  // SystemNode takes ISystem<unknown>. The overlay is only ever called with this map's own systems.
  const renderOverlay = props.renderSystemOverlay as
    | ((system: ISystem) => ReactNode)
    | undefined;

  return (
    <g onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
      <g>
        {[...result.lanes].reverse().map((index) => {
          const lane = data.lanes[index];
          return (
            <LaneNode
              key={lane.id}
              lane={lane}
              selected={isSelected("lane", lane.id)}
              interactive={props.selectionEnabled}
              highlightColor={props.highlightColor}
            />
          );
        })}
      </g>
      <g ref={systemsRef}>
        {[...result.systems].reverse().map(({ index }) => {
          const system = data.systems[index];
          return (
            <SystemNode
              key={system.id}
              system={system}
              selected={isSelected("system", system.id)}
              interactive={props.selectionEnabled}
              elementId={props.elementIdFor(system.id)}
              renderOverlay={renderOverlay}
              highlightColor={props.highlightColor}
            />
          );
        })}
      </g>
      <g>
        {[...result.systems]
          .reverse()
          .filter(({ labeled }) => labeled)
          .map(({ index }) => {
            const system = data.systems[index];
            return (
              <SystemLabel
                key={system.id}
                system={system}
                interactive={props.selectionEnabled}
              />
            );
          })}
      </g>
      <Highlight
        target={highlightTarget(data, props.hovered)}
        variant="hover"
        color={props.highlightColor}
      />
      <Highlight
        target={highlightTarget(
          data,
          props.focusedId === null
            ? null
            : { kind: "system", id: props.focusedId },
        )}
        variant="focus"
        color={props.highlightColor}
      />
      <g className={styles.free}>{props.children}</g>
    </g>
  );
}
