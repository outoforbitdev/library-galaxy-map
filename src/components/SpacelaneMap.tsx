import { colorToCss, MapColor } from "./Colors";
import styles from "../styles/items.module.css";
import { FocusLevel, getFocusClassName } from "./FocusLevels";

export interface ISpacelane {
  name: string;
  xOne: number;
  yOne: number;
  xTwo: number;
  yTwo: number;
  color: MapColor;
  focusLevel: FocusLevel;
}

interface ISpacelaneMapProps {
  spacelane: ISpacelane;
  centerX: number;
  centerY: number;
  zoomLevel: number;
}

export default function SpacelaneMap(props: ISpacelaneMapProps) {
  const spacelane = props.spacelane;
  const xOne = props.centerX + spacelane.xOne;
  const yOne = props.centerY - spacelane.yOne;
  const xTwo = props.centerX + spacelane.xTwo;
  const yTwo = props.centerY - spacelane.yTwo;
  const color = colorToCss(spacelane.color);

  const textRotation =
    (Math.atan((yTwo - yOne) / (xTwo - xOne)) * 180) / Math.PI;
  const textPosition = getTextPosition(xOne, xTwo, yOne, yTwo, textRotation);

  return (
    <g
      fill={color}
      stroke={color}
      className={
        styles.spacelane + " " + getFocusClassName(spacelane.focusLevel)
      }
    >
      <line
        x1={xOne}
        y1={yOne}
        x2={xTwo}
        y2={yTwo}
        className={styles.map_item}
      />
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
  const offSet = 30;
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
