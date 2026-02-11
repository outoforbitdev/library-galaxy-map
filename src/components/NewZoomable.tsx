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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const onWheel = function (event: WheelEvent) {
      event.preventDefault();
      // event.stopPropagation();

      // accumulate deltas
      pendingDeltaRef.current += event.deltaY;

      // already scheduled → bail
      if (rafRef.current !== null) return;

      const clientPosition = {
        x: event.clientX,
        y: event.clientY,
      };

      const mouseContainerPosition = clientPositionToContainerPosition(
        clientPosition,
        container,
      );

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;

        pendingDeltaRef.current = 0;

        const newZoomFactor = zoomRef.current * (event.deltaY < 0 ? 1.1 : 0.9);

        if (
          (props.maxZoom && newZoomFactor > props.maxZoom) ||
          (props.minZoom && newZoomFactor < props.minZoom)
        ) {
          return;
        }

        zoomRef.current = newZoomFactor;
        props.onZoomChange?.(newZoomFactor, mouseContainerPosition);
      });
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
    <div ref={containerRef} className={styles.zoomable}>
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

function clientPositionToZoomedPosition(
  clientPosition: IVector2,
  container: HTMLDivElement,
  zoom: number,
): IVector2 {
  const containerPosition = clientPositionToContainerPosition(
    clientPosition,
    container,
  );

  const zoomedPosition = {
    x: containerPosition.x * zoom,
    y: containerPosition.y * zoom,
  };

  return zoomedPosition;
}

function zoomedPositionToContainerPosition(
  zoomedPosition: IVector2,
  zoom: number,
): IVector2 {
  const containerPosition = {
    x: zoomedPosition.x / zoom,
    y: zoomedPosition.y / zoom,
  };

  return containerPosition;
}
