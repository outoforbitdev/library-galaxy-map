import { colorToCss, MapColor } from "./Colors";
import { zoomLevelToModifier } from "./ZoomableMap";

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
  const zoomModifier = zoomLevelToModifier(props.zoomLevel);
  const planet = props.planet;
  const x = props.centerX + planet.x / zoomModifier;
  const y = props.centerY - planet.y / zoomModifier;
  const name = planet.name;
  const color = colorToCss(planet.color);
  const inFocus = planet.focusLevel >= zoomModifier;
  const radius = inFocus ? 3 : zoomModifier - planet.focusLevel < 10 ? 2 : 1;
  if (zoomModifier - planet.focusLevel > 20 && !props.forceShow) return;

  return (
    <g fill={color} stroke={color}>
      <circle cx={x} cy={y} r={radius} />
      {inFocus && !props.hideLabel ? (
        <text
          x={x + 10}
          y={y + 5}
          fontWeight={"bold"}
          strokeWidth={"1px"}
          stroke="var(--neutral-background)"
        >
          {name}
        </text>
      ) : null}
    </g>
  );
}
