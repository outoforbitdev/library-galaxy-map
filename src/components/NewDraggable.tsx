import { IComponentProps } from "@outoforbitdev/ood-react";
import React, { MouseEventHandler, useEffect, useRef } from "react";
import { useState, WheelEventHandler } from "react";
import styles from "../styles/newmap.module.css";
import { IVector2 } from "./Vector2";

export interface IDraggableProps extends IComponentProps {
  onDrag: (delta: IVector2) => void,
}

export default function NewDraggable(props: IDraggableProps) {
    const isDragging = useRef<boolean>(false);
    const previousPosition = useRef<IVector2>({x: 0, y: 0});


    const onStart: MouseEventHandler<HTMLDivElement> = function(event) {
        isDragging.current = true;
        previousPosition.current = {
            x: event.clientX,
            y: event.clientY,
        };
    }

    const onMove: MouseEventHandler<HTMLDivElement> = function(event) {
        if (!isDragging.current) {
            return;
        }
        const currentPosition = {
            x: event.clientX,
            y: event.clientY,
        };

        props.onDrag({
            x: currentPosition.x - previousPosition.current.x,
            y: currentPosition.y - previousPosition.current.y,
        });

        previousPosition.current = currentPosition;
    }

    const onEnd: MouseEventHandler<HTMLDivElement> = function() {
        if (!isDragging.current) {
            return;
        };
        isDragging.current = false;
    }

    return(
        <div onMouseDown={onStart} onMouseUp={onEnd} onMouseMove={onMove}>
            {props.children}
        </div>
    )
}