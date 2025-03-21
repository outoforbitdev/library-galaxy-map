import { colorToCss, MapColor } from "./Colors";
import styles from "../styles/items.module.css";
import { getDomProps } from "../oodreact/IComponent";
import { FocusLevel, getFocusClassName } from "./FocusLevels";

export interface IPlanet {
  name: string;
  x: number;
  y: number;
  color: MapColor;
  focusLevel: FocusLevel;
}

interface IPlanetMapProps {
  planet: IPlanet;
  centerX: number;
  centerY: number;
  forceShow?: boolean;
  hideLabel?: boolean;
  zoomLevel: number;
}

export default function PlanetMap(props: IPlanetMapProps) {
  const planet = props.planet;
  const x = props.centerX + planet.x;
  const y = props.centerY - planet.y;
  const name = planet.name;
  const color = colorToCss(planet.color);

  return (
    <g
      fill={color}
      stroke={color}
      className={styles.planet + " " + getFocusClassName(planet.focusLevel)}
    >
      <line x1={x} y1={y} x2={x} y2={y} className={styles.map_item} />
      <text className={styles.map_label} x={x + 10} y={y + 5}>
        {name}
      </text>
    </g>
  );
}
