import { colorToCss, MapColor } from "./Colors";
import styles from "../styles/items.module.css";
import { FocusLevel } from "./FocusLevels";
import { IVector2 } from "./Vector2";

export interface IPlanet {
  id: string;
  name: string;
  coordinates: IVector2;
  color: MapColor;
  focusLevel: FocusLevel;
  selected?: boolean;
}

interface IMapPlanetProps {
  planet: IPlanet;
  hideLabel?: boolean;
  onClick?: (planetId: string) => void;
  selected?: boolean;
}

export default function MapPlanet(props: IMapPlanetProps) {
  const color = colorToCss(props.planet.color);
  const x = props.planet.coordinates.x;
  const y = props.planet.coordinates.y;

  return (
    <circle
      fill={color}
      stroke={color}
      onClick={() => props.onClick?.(props.planet.id)}
      className={styles.planet}
      cx={x}
      cy={y}
    />
  );
}
