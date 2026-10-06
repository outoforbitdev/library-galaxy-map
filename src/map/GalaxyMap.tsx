import { type IComponentProps, lib } from "@outoforbitdev/ood-react";
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Canvas, type ICanvasHandle } from "../canvas/Canvas";
import { DEFAULT_ZOOM } from "../canvas/constants";
import type { IViewportChangeInfo } from "../canvas/useViewport";
import {
  DEFAULT_MAX_LABELS,
  DEFAULT_MAX_LANE_SEGMENTS,
  DEFAULT_MAX_SYSTEMS,
  MAP_Y_AXIS,
} from "./constants";
import type { ICullResult } from "./cull";
import styles from "./GalaxyMap.module.css";
import { nextFocus } from "./keyboardFocus";
import { MapContent } from "./MapContent";
import type {
  EntityKind,
  IBounds,
  IEntityRef,
  ISpacelane,
  ISystem,
  IViewport,
  MapEntityEvent,
} from "./types";
import { useMapData } from "./useMapData";
import { useSelection } from "./useSelection";

/** Camera controls plus map actions, exposed through a GalaxyMap ref. */
export interface IGalaxyMapHandle extends ICanvasHandle {
  /** Selects an entity, or clears with null. In controlled mode it only calls onSelect. */
  select(ref: IEntityRef | null): void;
}

export interface IGalaxyMapProps<TSystemData = unknown, TLaneData = unknown>
  extends IComponentProps {
  /** Star systems in priority order, highest first. */
  systems: ISystem<TSystemData>[];
  /** Spacelanes in priority order, highest first. */
  spacelanes: ISpacelane<TLaneData>[];
  /** The selected entity. Controlled mode: the map only calls `onSelect` and never changes it itself. */
  selected?: IEntityRef | null;
  /** The initial selection in uncontrolled mode. A selection missing from the data is cleared. */
  defaultSelected?: IEntityRef | null;
  /** Called with the entity the user selected, or null when the selection is cleared. */
  onSelect?: (event: MapEntityEvent<TSystemData, TLaneData> | null) => void;
  /** Called with the entity under the pointer, or null when the pointer leaves it. */
  onHover?: (event: MapEntityEvent<TSystemData, TLaneData> | null) => void;
  /** False stops users from changing the selection. `selected` and `select()` still work. */
  selectionEnabled?: boolean;
  /** False turns off hover tracking and onHover. */
  hoverEnabled?: boolean;
  /**
   * Any CSS color for hover, focus, and selection highlights. One color
   * applies to every system and spacelane. It is set only on the highlight
   * elements, so overlays and children using currentColor are unaffected. It
   * overrides a `color` on the map's className. Without either, highlights use
   * the ood-react theme's `--ood-text`, or white (`#ffffff`) without a theme.
   */
  highlightColor?: string;
  /** Content drawn with each visible system, in pixels relative to its center. Memoize it. */
  renderSystemOverlay?: (system: ISystem<TSystemData>) => ReactNode;
  /** Most systems drawn at once. Defaults to 500. Zero hides every system. */
  maxSystems?: number;
  /** Most labels drawn at once. Defaults to 100. */
  maxLabels?: number;
  /** Most lane segments drawn at once. A hard limit. Defaults to 600. */
  maxLaneSegments?: number;
  /** False draws every system, label, and lane. Performance targets do not apply. */
  culling?: boolean;
  /** The content area. Defaults to the data's bounding box. */
  bounds?: IBounds;
  /** Smallest zoom, in screen pixels per world unit. Unlimited by default. */
  minZoom?: number;
  /** Largest zoom, in screen pixels per world unit. Unlimited by default. */
  maxZoom?: number;
  /** The camera. Controlled mode: the map only calls `onViewportChange` and never moves it itself. */
  viewport?: IViewport;
  /** The initial camera in uncontrolled mode. Without one, the map fits the data once it has data. */
  defaultViewport?: IViewport;
  /** Called as the camera moves. `info.settled` is true once when a gesture or camera move ends. */
  onViewportChange?: (viewport: IViewport, info: IViewportChangeInfo) => void;
  /** The map's accessible name. Defaults to "Galaxy map". */
  "aria-label"?: string;
  /** Handle for camera moves and `select()`. */
  ref?: Ref<IGalaxyMapHandle>;
}

/** An interactive map of star systems and spacelanes. */
export function GalaxyMap<TSystemData = unknown, TLaneData = unknown>(
  props: IGalaxyMapProps<TSystemData, TLaneData>,
) {
  const selectionEnabled = props.selectionEnabled ?? true;
  const data = useMapData(props.systems, props.spacelanes);
  const selection = useSelection({
    data,
    selected: props.selected,
    defaultSelected: props.defaultSelected,
    onSelect: props.onSelect,
    onHover: props.onHover,
  });
  const canvasRef = useRef<ICanvasHandle>(null);
  const visibleRef = useRef<ICullResult>({ systems: [], lanes: [] });
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const idPrefix = useId();
  const elementIdFor = useCallback(
    (systemId: string) => `${idPrefix}system-${encodeURIComponent(systemId)}`,
    [idPrefix],
  );

  useImperativeHandle(
    props.ref,
    () => ({
      moveTo: (target, options) => canvasRef.current?.moveTo(target, options),
      fitPoints: (points, options) =>
        canvasRef.current?.fitPoints(points, options),
      getViewport: () =>
        canvasRef.current?.getViewport() ?? {
          center: { x: 0, y: 0 },
          zoom: DEFAULT_ZOOM,
        },
      getSize: () => canvasRef.current?.getSize() ?? { width: 0, height: 0 },
      worldToScreen: (point) =>
        canvasRef.current?.worldToScreen(point) ?? point,
      screenToWorld: (point) =>
        canvasRef.current?.screenToWorld(point) ?? point,
      select: (ref) => selection.select(ref),
    }),
    [selection],
  );

  // Tracks what is drawn, and drops focus from a system that is no longer drawn.
  const handleCulled = useCallback(
    (result: ICullResult) => {
      visibleRef.current = result;
      setFocusedId((id) =>
        id !== null &&
        result.systems.some((s) => data.systems[s.index].id === id)
          ? id
          : null,
      );
    },
    [data],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Modified keys belong to the browser, such as Cmd or Alt with [ for back.
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "]" || event.key === "[") {
      event.preventDefault();
      const visible = visibleRef.current.systems.map(
        (s) => data.systems[s.index].id,
      );
      setFocusedId(nextFocus(visible, focusedId, event.key === "]" ? 1 : -1));
      return;
    }
    if (!selectionEnabled) return;
    if ((event.key === "Enter" || event.key === " ") && focusedId !== null) {
      event.preventDefault();
      selection.select({ kind: "system", id: focusedId });
    } else if (event.key === "Escape" && selection.selected) {
      // Without a selection Escape is not ours, so an enclosing dialog can use it.
      event.preventDefault();
      selection.select(null);
    }
  };

  // Clicks are handled at the canvas root: a click on empty space targets the <svg>.
  const handleClick = (event: MouseEvent) => {
    props.onClick?.(event);
    if (!selectionEnabled || event.defaultPrevented) return;
    const element = (event.target as Element).closest?.("[data-kind]");
    if (!element) {
      selection.select(null);
      return;
    }
    const rect = (event.currentTarget as Element).getBoundingClientRect();
    const world = canvasRef.current?.screenToWorld({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    selection.select(
      {
        kind: element.getAttribute("data-kind") as EntityKind,
        id: element.getAttribute("data-id") ?? "",
      },
      world,
    );
  };

  // Empty data has no meaningful bounds. Leaving them unset defers the initial
  // fit until data arrives, so data loaded after mount still gets fitted.
  const isEmpty = data.systems.length === 0 && data.lanes.length === 0;

  return (
    <Canvas
      ref={canvasRef}
      id={props.id}
      className={lib.classNames(styles.root, props.className)}
      style={props.style}
      onClick={handleClick}
      viewport={props.viewport}
      defaultViewport={props.defaultViewport}
      onViewportChange={props.onViewportChange}
      bounds={props.bounds ?? (isEmpty ? undefined : data.bounds)}
      minZoom={props.minZoom}
      maxZoom={props.maxZoom}
      yAxis={MAP_Y_AXIS}
      role="application"
      aria-roledescription="galaxy map"
      aria-label={props["aria-label"] ?? "Galaxy map"}
      aria-activedescendant={
        focusedId === null ? undefined : elementIdFor(focusedId)
      }
      onKeyDown={handleKeyDown}
    >
      <MapContent
        data={data}
        selected={selection.selected}
        hovered={selection.hovered}
        focusedId={focusedId}
        onHover={selection.hover}
        onCulled={handleCulled}
        selectionEnabled={selectionEnabled}
        hoverEnabled={props.hoverEnabled ?? true}
        highlightColor={props.highlightColor}
        culling={props.culling ?? true}
        maxSystems={props.maxSystems ?? DEFAULT_MAX_SYSTEMS}
        maxLabels={props.maxLabels ?? DEFAULT_MAX_LABELS}
        maxLaneSegments={props.maxLaneSegments ?? DEFAULT_MAX_LANE_SEGMENTS}
        elementIdFor={elementIdFor}
        renderSystemOverlay={props.renderSystemOverlay}
      >
        {props.children}
      </MapContent>
    </Canvas>
  );
}
