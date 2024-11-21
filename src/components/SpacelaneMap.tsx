import { colorToCss, MapColor } from "./Colors";
import { zoomLevelToModifier } from "./ZoomableMap";

export interface ISpacelane {
  name: string;
  xOne: number;
  yOne: number;
  xTwo: number;
  yTwo: number;
  color: MapColor;
  focusLevel: number;
}

interface ISpacelaneMapProps {
  spacelane: ISpacelane;
  centerX: number;
  centerY: number;
  forceShow?: boolean;
  hideLabel?: boolean;
  zoomLevel: number;
}

export default function SpacelaneMap(props: ISpacelaneMapProps) {
  const zoomModifier = zoomLevelToModifier(props.zoomLevel);
  const spacelane = props.spacelane;
  const xOne = props.centerX + spacelane.xOne / zoomModifier;
  const yOne = props.centerY - spacelane.yOne / zoomModifier;
  const xTwo = props.centerX + spacelane.xTwo / zoomModifier;
  const yTwo = props.centerY - spacelane.yTwo / zoomModifier;
  const name = spacelane.name;
  const color = colorToCss(spacelane.color);
  const inFocus = spacelane.focusLevel >= zoomModifier;
  const strokeWidth = inFocus ? 2 : 1;
  if (zoomModifier - spacelane.focusLevel > 5 && !props.forceShow) return;

  const textRotation =
    (Math.atan((yTwo - yOne) / (xTwo - xOne)) * 180) / Math.PI;
  const textPosition = getTextPosition(xOne, xTwo, yOne, yTwo, textRotation);

  return (
    <g fill={color} stroke={color}>
      <line x1={xOne} y1={yOne} x2={xTwo} y2={yTwo} strokeWidth={strokeWidth} />
      {inFocus &&
      checkIfSpaceForText(xOne, xTwo, yOne, yTwo, name) &&
      !props.hideLabel ? (
        <text
          x={textPosition.x}
          y={textPosition.y}
          transform={`rotate(${textRotation} ${textPosition.x} ${textPosition.y})`}
          textAnchor="middle"
          dominantBaseline="middle"
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

function getTextPosition(
  xOne: number,
  xTwo: number,
  yOne: number,
  yTwo: number,
  textRotation: number,
) {
  const textPosition = {
    x: (xOne + xTwo) / 2,
    y: (yOne + yTwo) / 2,
  };
  const xOffsetDirection = textRotation > 0 ? 1 : -1;
  const offSet = 20;
  if (Math.abs(xOne - xTwo) > Math.abs(yOne - yTwo)) {
    textPosition.y =
      textPosition.y -
      (textPosition.y / (textPosition.x + textPosition.y)) * offSet;
  } else {
    textPosition.x =
      textPosition.x +
      (textPosition.x / (textPosition.x + textPosition.y)) *
        offSet *
        xOffsetDirection;
  }

  return textPosition;
}

function checkIfSpaceForText(
  xOne: number,
  xTwo: number,
  yOne: number,
  yTwo: number,
  text: string,
) {
  const characterLength = 10;
  const requiredLength = text.length * characterLength;
  return (
    Math.abs(xOne - xTwo) > requiredLength ||
    Math.abs(yOne - yTwo) > requiredLength
  );
}
