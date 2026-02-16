import { IComponentProps } from "@outoforbitdev/ood-react";
import React, { useEffect, useRef } from "react";
import { IVector2 } from "./Vector2";

interface IViewportControllerProps extends IComponentProps {
  onDragStart?: () => void;
  onDragMove?: (delta: IVector2) => void;
  onDragEnd?: () => void;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  onZoomStart?: () => void;
  onZoomChange?: (zoomFactor: number, mouseContainerPosition: IVector2) => void;
  onZoomEnd?: () => void;
}

export default function ViewportController(props: IViewportControllerProps) {
  // Pan properties
  const previousPosition = useRef<IVector2>({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);
  const pointerCount = useRef(0);

  // Zoom properties
  const zoomRef = useRef(props.initialZoom || 1);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const pendingZoomRef = useRef<number | null>(null);
  const pendingFocusRef = useRef<IVector2 | null>(null);

  const pointersRef = useRef<Map<number, IVector2>>(new Map());
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef<number>(zoomRef.current);

  const lastWheelTime = useRef<number>(0);
  const zooming = useRef<boolean>(false);

  function cancelDrag(element: HTMLDivElement) {
    if (activePointerId.current !== null) {
      if (props.onDragEnd) props.onDragEnd();
      //   element.releasePointerCapture(activePointerId.current);
    }

    activePointerId.current = null;
  }

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    // Pan
    pointerCount.current++;
    // If we already have an active pointer, cancel drag (multi-touch detected)
    if (activePointerId.current !== null) {
      cancelDrag(event.currentTarget);
      return;
    }

    // Only primary button for mouse
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    activePointerId.current = event.pointerId;
    previousPosition.current = {
      x: event.clientX,
      y: event.clientY,
    };

    // event.currentTarget.setPointerCapture(event.pointerId);

    // Zoom
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size === 2) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const currentDistance = distance(p1, p2);
      initialPinchDistanceRef.current = currentDistance;
      initialPinchZoomRef.current = zoomRef.current;
    }
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    // Pan
    if (event.pointerId !== activePointerId.current) return;

    const delta = {
      x: event.clientX - previousPosition.current.x,
      y: event.clientY - previousPosition.current.y,
    };

    if (props.onDragMove) props.onDragMove(delta);

    previousPosition.current = {
      x: event.clientX,
      y: event.clientY,
    };

    // Zoom
    if (!pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size !== 2) return;

    if (initialPinchDistanceRef.current === null) return;

    const [p1, p2] = Array.from(pointersRef.current.values());

    const currentDistance = distance(p1, p2);

    const scale = currentDistance / initialPinchDistanceRef.current;

    const newZoom = initialPinchZoomRef.current * scale;

    const midpoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };

    const mouseContainerPosition = clientPositionToContainerPosition(
      midpoint,
      containerRef.current!,
    );

    scheduleZoom(newZoom, mouseContainerPosition);
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    // Pan
    pointerCount.current = Math.max(0, pointerCount.current - 1);

    if (event.pointerId !== activePointerId.current) return;

    cancelDrag(event.currentTarget);

    // Zoom
    pointersRef.current.delete(event.pointerId);
    // event.currentTarget.releasePointerCapture(event.pointerId);

    if (pointersRef.current.size < 2) {
      initialPinchDistanceRef.current = null;
      if (props.onZoomEnd) {
        props.onZoomEnd();
      }
    }
  };

  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    pointerCount.current = Math.max(0, pointerCount.current - 1);

    if (event.pointerId !== activePointerId.current) return;

    cancelDrag(event.currentTarget);
  };

  function checkZoomEnd() {
    if (!props.onZoomEnd) return;
    if (zooming.current) {
      const timeSinceLastWheelEvent = performance.now() - lastWheelTime.current;
      if (timeSinceLastWheelEvent > 120) {
        props.onZoomEnd();
      } else {
        requestAnimationFrame(checkZoomEnd);
      }
    }
  }

  function applyZoom(newZoom: number, mouseContainerPosition: IVector2) {
    if (
      (props.maxZoom && newZoom > props.maxZoom) ||
      (props.minZoom && newZoom < props.minZoom)
    ) {
      return;
    }

    zoomRef.current = newZoom;
    props.onZoomChange?.(newZoom, mouseContainerPosition);
  }

  function scheduleZoom(newZoom: number, focus: IVector2) {
    pendingZoomRef.current = newZoom;
    pendingFocusRef.current = focus;

    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;

      if (pendingZoomRef.current !== null && pendingFocusRef.current !== null) {
        applyZoom(pendingZoomRef.current, pendingFocusRef.current);
      }

      pendingZoomRef.current = null;
      pendingFocusRef.current = null;
    });
  }

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const onWheel = function (event: WheelEvent) {
      event.preventDefault();

      const mouseContainerPosition = clientPositionToContainerPosition(
        { x: event.clientX, y: event.clientY },
        container,
      );

      const scale = event.deltaY < 0 ? 1.1 : 0.9;
      const newZoomFactor = zoomRef.current * scale;

      zooming.current = true;
      lastWheelTime.current = performance.now();
      scheduleZoom(newZoomFactor, mouseContainerPosition);
      requestAnimationFrame(checkZoomEnd);
    };

    container.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", onWheel);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{ touchAction: "none" }} // disables browser gestures
      className={props.className}
      ref={containerRef}
    >
      {props.children}
    </div>
  );
}

function clientPositionToContainerPosition(
  clientPosition: IVector2,
  container: HTMLDivElement,
): IVector2 {
  const rect = container.getBoundingClientRect();

  const containerPosition = {
    x: clientPosition.x - rect.left,
    y: clientPosition.y - rect.top,
  };

  return containerPosition;
}

function distance(a: IVector2, b: IVector2) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
