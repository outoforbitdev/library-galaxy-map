import { colorToCss, MapColor } from "./Colors";
import styles from "../styles/map.module.css";
import { getDomProps } from "../oodreact/IComponent";

export interface IPlanet {
  name: string;
  x: number;
  y: number;
  color: MapColor;
  focusLevel: number;
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
  // console.log(x);
  const name = planet.name;
  const color = colorToCss(planet.color);
  const inFocus = true;
  // const radius = inFocus ? 3 : zoomModifier - planet.focusLevel < 10 ? 2 : 1;
  // if (zoomModifier - planet.focusLevel > 20 && !props.forceShow) return;

  return (
    <g fill={color} stroke={color}>
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={y}
        {...getDomProps(
          {},
          styles.planet,
          planet.focusLevel > 50 ? styles.primary : styles.secondary,
        )}
      />
      {/* <circle cx={x} cy={y} r={radius} /> */}
      {inFocus && !props.hideLabel ? (
        <text
          {...getDomProps(
            {},
            styles.planet_label,
            planet.focusLevel > 50 ? styles.primary : styles.secondary,
          )}
          x={x + 10}
          y={y + 5}
        >
          {name}
        </text>
      ) : null}
    </g>
  );
}
