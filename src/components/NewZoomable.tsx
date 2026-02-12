import { IComponentProps } from "@outoforbitdev/ood-react";
import React, { useEffect, useRef } from "react";
import { useState, WheelEventHandler } from "react";
import styles from "../styles/newmap.module.css";
import { IVector2 } from "./Vector2";

export interface IZoomableProps extends IComponentProps {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  onZoomChange?: (zoomFactor: number, mouseContainerPosition: IVector2) => void;
}

export default function NewZoomable(props: IZoomableProps) {
  const zoomRef = useRef(props.initialZoom || 1);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingDeltaRef = useRef(0);

  const pendingZoomRef = useRef<number | null>(null);
  const pendingFocusRef = useRef<IVector2 | null>(null);

  const pointersRef = useRef<Map<number, IVector2>>(new Map());
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialPinchZoomRef = useRef<number>(zoomRef.current);

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

      scheduleZoom(newZoomFactor, mouseContainerPosition);
    };

    container.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", onWheel);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    event.currentTarget.setPointerCapture(event.pointerId);

    if (pointersRef.current.size === 2) {
      const [p1, p2] = Array.from(pointersRef.current.values());
      const currentDistance = distance(p1, p2);
      initialPinchDistanceRef.current = currentDistance;
      initialPinchZoomRef.current = zoomRef.current;
    }
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
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
    pointersRef.current.delete(event.pointerId);
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (pointersRef.current.size < 2) {
      initialPinchDistanceRef.current = null;
    }
  };

  return (
    <div
      ref={containerRef}
      className={styles.zoomable}
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
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
