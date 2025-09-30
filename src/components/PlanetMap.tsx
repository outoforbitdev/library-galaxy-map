import { colorToCss, MapColor } from "./Colors";
import styles from "../styles/items.module.css";
import { FocusLevel, getFocusClassName } from "./FocusLevels";
import { useState } from "react";

export interface IPlanet {
  id: string;
  name: string;
  x: number;
  y: number;
  color: MapColor;
  focusLevel: FocusLevel;
  selected?: boolean;
}

interface IPlanetMapProps {
  planet: IPlanet;
  centerX: number;
  centerY: number;
  forceShow?: boolean;
  hideLabel?: boolean;
  zoomLevel: number;
  onClick?: (planet: IPlanet) => void;
  selected?: boolean;
}

export default function PlanetMap(props: IPlanetMapProps) {
  const x = props.centerX + props.planet.x;
  const y = props.centerY - props.planet.y;
  const name = props.planet.name;
  const color = colorToCss(props.planet.color);

  return (
    <g
      fill={color}
      stroke={color}
      className={styles.planet + " " + getFocusClassName(props.planet.focusLevel)}
      onClick={() => props.onClick?.(props.planet)}
    >
      {props.selected ? <line x1={x} y1={y} x2={x} y2={y} className={styles.planet_outline} /> : null}
      <line x1={x} y1={y} x2={x} y2={y} className={styles.map_item} />
      <text className={styles.map_label} x={x + 10} y={y + 5}>
        {name}
      </text>
    </g>
  );
}
