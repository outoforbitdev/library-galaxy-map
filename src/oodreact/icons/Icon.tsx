import {
  getDomProps,
  IChildlessComponentProps,
  IComponentProps,
} from "../IComponent";
import styles from "./icon.module.css";

export interface IIconProps extends IChildlessComponentProps {
  clickable?: boolean;
  invert?: boolean;
  size?: IconSize;
}

interface IIconInternalProps extends IComponentProps {
  externalProps: IIconProps;
  preventInvert?: boolean;
  viewBoxSize: number;
}

export enum IconSize {
  Small = 10,
  Medium = 15,
  Large = 20,
}

export function Icon(props: IIconInternalProps) {
  const sizeClass = getClassFromSize(props.externalProps.size);
  const foregroundColor = "currentColor";
  const backgroundCornerRadius = props.viewBoxSize / 3;
  const background = (
    <rect
      x={0}
      y={0}
      height={props.viewBoxSize}
      width={props.viewBoxSize}
      rx={backgroundCornerRadius}
      fill={foregroundColor}
      stroke={foregroundColor}
      mask="url(#iconMask)"
    />
  );
  const inverted = props.externalProps.invert && !props.preventInvert;
  return (
    <svg
      stroke={foregroundColor}
      fill={foregroundColor}
      viewBox={`0 0 ${props.viewBoxSize} ${props.viewBoxSize}`}
      strokeWidth={10}
      {...getDomProps(
        props.externalProps,
        sizeClass,
        props.externalProps.clickable ? styles.clickable : undefined,
      )}
    >
      {inverted ? (
        <defs>
          <mask id="iconMask">
            <rect
              x={0}
              y={0}
              height={props.viewBoxSize}
              width={props.viewBoxSize}
              fill="white"
            />
            <g stroke="black" fill="black">
              {props.children}
            </g>
          </mask>
        </defs>
      ) : null}
      {inverted ? background : props.children}
    </svg>
  );
}

function getClassFromSize(size?: IconSize) {
  switch (size) {
    case IconSize.Small:
      return styles.small;
    case IconSize.Large:
      return styles.large;
    case IconSize.Medium:
    default:
      return styles.medium;
  }
}
