import { IComponentProps } from "@outoforbitdev/ood-react";
import React, { useEffect, useRef } from "react";
import { IVector2 } from "./Vector2";
import {
  clientPositionToContainerPosition,
  distance,
} from "./ViewportControllerHelpers";

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
  const previousPanPointerPosition = useRef<IVector2>({ x: 0, y: 0 });
  const activePanPointerId = useRef<number | null>(null);
  const panPointerCount = useRef(0);

  // Zoom properties
  const currentZoomRef = useRef(props.initialZoom || 1);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRafRef = useRef<number | null>(null);

  const pendingZoomRef = useRef<number | null>(null);
  const pendingFocusRef = useRef<IVector2 | null>(null);

  const zoomPointersRef = useRef<Map<number, IVector2>>(new Map());
  const initialZoomPinchDistanceRef = useRef<number | null>(null);
  const initialZoomPinchZoomRef = useRef<number>(currentZoomRef.current);

  const lastWheelTime = useRef<number>(0);
  const isWheelZooming = useRef<boolean>(false);

  function cancelDrag(element: HTMLDivElement) {
    if (activePanPointerId.current !== null) {
      if (props.onDragEnd) props.onDragEnd();
      element.releasePointerCapture(activePanPointerId.current);
    }

    activePanPointerId.current = null;
  }

  function handlePanStart(event: React.PointerEvent<HTMLDivElement>) {
    panPointerCount.current++;
    // If we already have an active pointer, cancel drag (multi-touch detected)
    if (activePanPointerId.current !== null) {
      cancelDrag(event.currentTarget);
      return;
    }

    // Only primary button for mouse
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    activePanPointerId.current = event.pointerId;
    previousPanPointerPosition.current = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  function handlePanMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerId !== activePanPointerId.current) return;

    const delta = {
      x: event.clientX - previousPanPointerPosition.current.x,
      y: event.clientY - previousPanPointerPosition.current.y,
    };

    if (props.onDragMove) props.onDragMove(delta);

    previousPanPointerPosition.current = {
      x: event.clientX,
      y: event.clientY,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePanEnd(event: React.PointerEvent<HTMLDivElement>) {
    panPointerCount.current = Math.max(0, panPointerCount.current - 1);

    if (event.pointerId !== activePanPointerId.current) return;

    cancelDrag(event.currentTarget);
  }

  function checkZoomEnd() {
    if (!props.onZoomEnd) return;
    if (isWheelZooming.current) {
      const timeSinceLastWheelEvent = performance.now() - lastWheelTime.current;
      if (timeSinceLastWheelEvent > 120) {
        props.onZoomEnd();
        isWheelZooming.current = false;
      } else {
        requestAnimationFrame(checkZoomEnd);
      }
    }
  }

  function applyZoom(newZoom: number, mouseContainerPosition: IVector2) {
    if (props.maxZoom !== undefined && newZoom > props.maxZoom) return;
    if (props.minZoom !== undefined && newZoom < props.minZoom) return;

    currentZoomRef.current = newZoom;
    props.onZoomChange?.(newZoom, mouseContainerPosition);
  }

  function scheduleZoom(newZoom: number, focus: IVector2) {
    pendingZoomRef.current = newZoom;
    pendingFocusRef.current = focus;

    if (zoomRafRef.current !== null) return;

    zoomRafRef.current = requestAnimationFrame(() => {
      zoomRafRef.current = null;

      if (pendingZoomRef.current !== null && pendingFocusRef.current !== null) {
        applyZoom(pendingZoomRef.current, pendingFocusRef.current);
      }

      pendingZoomRef.current = null;
      pendingFocusRef.current = null;
    });
  }

  function handleZoomPinchStart(event: React.PointerEvent<HTMLDivElement>) {
    zoomPointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (zoomPointersRef.current.size === 2) {
      const [p1, p2] = Array.from(zoomPointersRef.current.values());
      const currentDistance = distance(p1, p2);
      initialZoomPinchDistanceRef.current = currentDistance;
      initialZoomPinchZoomRef.current = currentZoomRef.current;
    }
  }

  function handleZoomPinchChange(event: React.PointerEvent<HTMLDivElement>) {
    if (!zoomPointersRef.current.has(event.pointerId)) return;

    zoomPointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (zoomPointersRef.current.size !== 2) return;

    if (initialZoomPinchDistanceRef.current === null) return;

    const [p1, p2] = Array.from(zoomPointersRef.current.values());

    const currentDistance = distance(p1, p2);

    const scale = currentDistance / initialZoomPinchDistanceRef.current;

    const newZoom = initialZoomPinchZoomRef.current * scale;

    const midpoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };

    const mouseContainerPosition = clientPositionToContainerPosition(
      midpoint,
      containerRef.current!,
    );

    scheduleZoom(newZoom, mouseContainerPosition);
  }

  function handleZoomPinchEnd(event: React.PointerEvent<HTMLDivElement>) {
    zoomPointersRef.current.delete(event.pointerId);
    // event.currentTarget.releasePointerCapture(event.pointerId);

    if (zoomPointersRef.current.size < 2) {
      initialZoomPinchDistanceRef.current = null;
      if (props.onZoomEnd) {
        props.onZoomEnd();
      }
    }
  }

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    handlePanStart(event);
    handleZoomPinchStart(event);
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    handlePanMove(event);
    handleZoomPinchChange(event);
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    handlePanEnd(event);
    handleZoomPinchEnd(event);
  };

  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    handlePanEnd(event);
  };

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
      const newZoomFactor = currentZoomRef.current * scale;

      isWheelZooming.current = true;
      lastWheelTime.current = performance.now();
      scheduleZoom(newZoomFactor, mouseContainerPosition);
      requestAnimationFrame(checkZoomEnd);
    };

    container.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", onWheel);
      if (zoomRafRef.current !== null) {
        cancelAnimationFrame(zoomRafRef.current);
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
