import {
  type MouseEvent,
  type PointerEvent,
  type RefObject,
  useEffect,
  useRef,
} from "react";
import { WHEEL_SETTLE_MS } from "./constants";
import {
  exceedsDragThreshold,
  panByPixels,
  pinchUpdate,
  wheelZoomFactor,
  zoomAtPoint,
} from "./gestures";
import type { IPoint, ISize, YAxis } from "./types";
import type { IViewportController } from "./useViewport";

export interface IGestureOptions {
  rootRef: RefObject<HTMLDivElement | null>;
  camera: IViewportController;
  sizeRef: { current: ISize };
  yAxis: YAxis;
  setGesturing: (gesturing: boolean) => void;
}

export interface IGestureHandlers {
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => void;
  onClickCapture: (event: MouseEvent<HTMLDivElement>) => void;
}

/**
 * Drag to pan, pinch to zoom, wheel to zoom around the pointer. A press only
 * becomes a pan past the drag threshold, and the click after a pan is
 * cancelled before any child sees it.
 */
export function useGestures(options: IGestureOptions): IGestureHandlers {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const pointers = useRef(new Map<number, IPoint>());
  const pressStart = useRef<IPoint | null>(null);
  const panning = useRef(false);
  const suppressClick = useRef(false);
  const wheelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toLocal = (event: { clientX: number; clientY: number }): IPoint => {
    const rect = optionsRef.current.rootRef.current?.getBoundingClientRect();
    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    };
  };

  const beginPan = (event: PointerEvent<HTMLDivElement>) => {
    panning.current = true;
    optionsRef.current.setGesturing(true);
    // Capture only once panning, so a plain click still targets the element under the pointer.
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    suppressClick.current = false;
    optionsRef.current.camera.cancelAnimation();
    const point = toLocal(event);
    pointers.current.set(event.pointerId, point);
    if (pointers.current.size === 1) pressStart.current = point;
    else if (!panning.current) beginPan(event);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    // A mouse move with no button down means the release happened where this
    // element could not see it, such as outside the window. End the gesture.
    if (event.pointerType === "mouse" && event.buttons === 0) {
      onPointerEnd(event);
      return;
    }
    const point = toLocal(event);
    const { camera, sizeRef, yAxis } = optionsRef.current;

    if (pointers.current.size >= 2) {
      const [first, second] = Array.from(pointers.current.keys());
      const before: [IPoint, IPoint] = [
        pointers.current.get(first)!,
        pointers.current.get(second)!,
      ];
      pointers.current.set(event.pointerId, point);
      const after: [IPoint, IPoint] = [
        pointers.current.get(first)!,
        pointers.current.get(second)!,
      ];
      camera.moveBy((viewport) =>
        pinchUpdate(before, after, viewport, sizeRef.current, yAxis),
      );
      return;
    }

    pointers.current.set(event.pointerId, point);
    const start = pressStart.current;
    if (!panning.current) {
      if (!start || !exceedsDragThreshold(start, point, event.pointerType))
        return;
      beginPan(event);
      camera.moveBy((viewport) =>
        panByPixels(viewport, point.x - start.x, point.y - start.y, yAxis),
      );
      return;
    }
    camera.moveBy((viewport) =>
      panByPixels(viewport, point.x - previous.x, point.y - previous.y, yAxis),
    );
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size > 0) {
      // One finger of a pinch lifted: keep panning with the remaining finger.
      pressStart.current = Array.from(pointers.current.values())[0];
      return;
    }
    pressStart.current = null;
    if (panning.current) {
      panning.current = false;
      suppressClick.current = true;
      optionsRef.current.setGesturing(false);
      optionsRef.current.camera.settle();
    }
  };

  // Only capture held by the canvas itself counts. Taking capture makes the
  // browser fire this event on the element that held it implicitly (touch does
  // this), and it bubbles here while the gesture is just starting.
  const onLostPointerCapture = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onPointerEnd(event);
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    const root = options.rootRef.current;
    if (!root) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { camera, sizeRef, yAxis } = optionsRef.current;
      camera.cancelAnimation();
      const point = toLocal(event);
      const factor = wheelZoomFactor(
        event.deltaY,
        event.deltaMode,
        event.ctrlKey,
      );
      camera.moveBy((viewport) =>
        zoomAtPoint(viewport, sizeRef.current, point, factor, yAxis),
      );
      if (wheelTimer.current !== null) clearTimeout(wheelTimer.current);
      wheelTimer.current = setTimeout(() => {
        wheelTimer.current = null;
        optionsRef.current.camera.settle();
      }, WHEEL_SETTLE_MS);
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      root.removeEventListener("wheel", onWheel);
      if (wheelTimer.current !== null) clearTimeout(wheelTimer.current);
    };
    // toLocal reads through optionsRef, so the listener never goes stale.
  }, [options.rootRef]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
    onLostPointerCapture,
    onClickCapture,
  };
}
