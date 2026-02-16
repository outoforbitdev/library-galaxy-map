import { colorToCss, MapColor } from "./Colors";
import styles from "../styles/items.module.css";
import { FocusLevel, getFocusClassName } from "./FocusLevels";
import { IVector2 } from "./Vector2";

export interface IPlanet {
  id: string;
  name: string;
  coordinates: IVector2;
  color: MapColor;
  focusLevel: FocusLevel;
  selected?: boolean;
}

interface IMapLabelProps {
  id: string;
  label: string;
  coordinates: IVector2;
  color: MapColor;
  onClick?: (id: string) => void;
}

export default function MapLabel(props: IMapLabelProps) {
  const label = props.label;
  const color = colorToCss(props.color);
  const { x, y } = props.coordinates;

  return (
    <g
      fill={color}
      stroke={color}
      className={styles.planet}
      key={props.id}
      onClick={() => props.onClick?.(props.id)}
    >
      <text
        className={styles.map_label}
        x={x + 10}
        y={y + 5}
        vectorEffect="non-scaling-stroke"
      >
        {label}
      </text>
    </g>
  );
}
