import { IComponentProps } from "@outoforbitdev/ood-react";
import React, { MouseEventHandler, useEffect, useRef } from "react";
import { useState, WheelEventHandler } from "react";
import styles from "../styles/newmap.module.css";
import { IVector2 } from "./Vector2";

export interface IDraggableProps extends IComponentProps {
  onDrag: (delta: IVector2) => void;
}

export default function NewDraggable(props: IDraggableProps) {
  const previousPosition = useRef<IVector2>({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);
  const pointerCount = useRef(0);

  function cancelDrag(element: HTMLDivElement) {
    if (activePointerId.current !== null) {
      //   element.releasePointerCapture(activePointerId.current);
    }

    activePointerId.current = null;
  }

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
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
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (event.pointerId !== activePointerId.current) return;

    const delta = {
      x: event.clientX - previousPosition.current.x,
      y: event.clientY - previousPosition.current.y,
    };

    props.onDrag(delta);

    previousPosition.current = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    pointerCount.current = Math.max(0, pointerCount.current - 1);

    if (event.pointerId !== activePointerId.current) return;

    cancelDrag(event.currentTarget);
  };

  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    pointerCount.current = Math.max(0, pointerCount.current - 1);

    if (event.pointerId !== activePointerId.current) return;

    cancelDrag(event.currentTarget);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{ touchAction: "none" }} // disables browser gestures
    >
      {props.children}
    </div>
  );
}
