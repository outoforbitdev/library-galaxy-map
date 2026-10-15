import { type IComponentProps, lib } from "@outoforbitdev/ood-react";
import {
  type KeyboardEvent,
  type Ref,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./Canvas.module.css";
import { CanvasContext, type ICanvasContext } from "./CanvasContext";
import { keyAction, panByPixels, zoomAtPoint } from "./gestures";
import {
  fitViewport,
  screenToWorld,
  worldToScreen,
  worldTransform,
  ySign,
} from "./projection";
import type {
  IBounds,
  IPadding,
  IPoint,
  ISize,
  IViewport,
  YAxis,
} from "./types";
import { useGestures } from "./useGestures";
import { type IViewportChangeInfo, useViewport } from "./useViewport";

/** Camera controls exposed through a Canvas ref. */
export interface ICanvasHandle {
  /** Pans, zooms, or both. Animates when `duration` (ms) is above 0. */
  moveTo(
    target: { center?: IPoint; zoom?: number },
    options?: { duration?: number },
  ): void;
  /** Moves so every point is visible inside the padding. */
  fitPoints(
    points: IPoint[],
    options?: { padding?: number | IPadding; duration?: number },
  ): void;
  getViewport(): IViewport;
  getSize(): ISize;
  worldToScreen(point: IPoint): IPoint;
  screenToWorld(point: IPoint): IPoint;
}

export interface ICanvasProps extends IComponentProps {
  viewport?: IViewport;
  defaultViewport?: IViewport;
  onViewportChange?: (viewport: IViewport, info: IViewportChangeInfo) => void;
  /** The content area. The view center may move up to half a view beyond it. */
  bounds?: IBounds;
  minZoom?: number;
  maxZoom?: number;
  /** Direction of positive world y. Defaults to "down". */
  yAxis?: YAxis;
  /** Runs before the canvas's own keys. Keys it handles with preventDefault are ignored. */
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  role?: string;
  "aria-label"?: string;
  "aria-roledescription"?: string;
  "aria-activedescendant"?: string;
  ref?: Ref<ICanvasHandle>;
}

/**
 * A generic pan and zoom surface. Children are drawn in world coordinates.
 * Camera movement writes one transform per frame without rendering React.
 */
export function Canvas(props: ICanvasProps) {
  const yAxis = props.yAxis ?? "down";
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<SVGGElement>(null);
  const [size, setSize] = useState<ISize>({ width: 0, height: 0 });
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const [gesturing, setGesturing] = useState(false);

  useLayoutEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const apply = (viewport: IViewport) => {
    const element = worldRef.current;
    const current = sizeRef.current;
    if (!element || current.width <= 0 || current.height <= 0) return;
    element.setAttribute("transform", worldTransform(viewport, current, yAxis));
    element.style.setProperty("--zoom", String(viewport.zoom));
    element.style.setProperty("--y-sign", String(ySign(yAxis)));
  };

  const camera = useViewport({
    viewport: props.viewport,
    defaultViewport: props.defaultViewport,
    onViewportChange: props.onViewportChange,
    bounds: props.bounds,
    minZoom: props.minZoom,
    maxZoom: props.maxZoom,
    size,
    yAxis,
    apply,
  });

  const toScreen = (point: IPoint) =>
    worldToScreen(point, camera.getViewport(), sizeRef.current, yAxis);
  const toWorld = (point: IPoint) =>
    screenToWorld(point, camera.getViewport(), sizeRef.current, yAxis);

  useImperativeHandle(
    props.ref,
    () => ({
      moveTo(target, options) {
        const current = camera.getViewport();
        camera.animateTo(
          {
            center: target.center ?? current.center,
            zoom: target.zoom ?? current.zoom,
          },
          options?.duration ?? 0,
        );
      },
      fitPoints(points, options) {
        const fitted = fitViewport(points, sizeRef.current, {
          padding: options?.padding,
          bounds: props.bounds,
          minZoom: props.minZoom,
          maxZoom: props.maxZoom,
          yAxis,
        });
        if (fitted) camera.animateTo(fitted, options?.duration ?? 0);
      },
      getViewport: () => camera.getViewport(),
      getSize: () => sizeRef.current,
      worldToScreen: toScreen,
      screenToWorld: toWorld,
    }),
    [camera, props.bounds, props.minZoom, props.maxZoom, yAxis],
  );

  const gestures = useGestures({
    rootRef,
    camera,
    sizeRef,
    yAxis,
    setGesturing,
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    props.onKeyDown?.(event);
    // Modified keys belong to the browser, such as Ctrl or Cmd with plus for page zoom.
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    const current = sizeRef.current;
    const action = keyAction(event.key, current);
    if (!action) return;
    event.preventDefault();
    camera.cancelAnimation();
    camera.moveBy((viewport, limits) =>
      action.type === "pan"
        ? panByPixels(viewport, action.dx, action.dy, yAxis)
        : zoomAtPoint(
            viewport,
            current,
            { x: current.width / 2, y: current.height / 2 },
            action.factor,
            yAxis,
            limits,
          ),
    );
    camera.settle();
  };

  const context = useMemo<ICanvasContext>(
    () => ({
      viewport: camera.published,
      size,
      yAxis,
      gesturing,
      worldToScreen: toScreen,
      screenToWorld: toWorld,
    }),
    // toScreen and toWorld read the live camera through refs, so they need not be dependencies.
    [camera, size, yAxis, gesturing],
  );

  return (
    <div
      {...lib.getDomProps(props, styles.root)}
      ref={rootRef}
      tabIndex={0}
      role={props.role}
      aria-label={props["aria-label"]}
      aria-roledescription={props["aria-roledescription"]}
      aria-activedescendant={props["aria-activedescendant"]}
      onKeyDown={handleKeyDown}
      {...gestures}
    >
      <svg className={styles.svg}>
        <g ref={worldRef}>
          {size.width > 0 && size.height > 0 && (
            <CanvasContext.Provider value={context}>
              {props.children}
            </CanvasContext.Provider>
          )}
        </g>
      </svg>
    </div>
  );
}
