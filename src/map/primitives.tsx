import type { SVGProps } from "react";
import { lib } from "@outoforbitdev/ood-react";
import { GLYPH_RADIUS_PX } from "./constants";
import styles from "./GalaxyMap.module.css";
import type { IPoint } from "./types";

export interface ISystemGlyphProps {
  x?: number;
  y?: number;
  color: string;
  radius?: number;
  className?: string;
}

/** The glyph GalaxyMap draws for a system. Renders in any <svg>, for legends and infoboxes. */
export function SystemGlyph({
  x = 0,
  y = 0,
  color,
  radius = GLYPH_RADIUS_PX,
  className,
}: ISystemGlyphProps) {
  return (
    <circle
      className={className ?? styles.glyph}
      cx={x}
      cy={y}
      r={radius}
      fill={color}
    />
  );
}

/**
 * Attributes shared by every drawn lane. Width and caps are deliberately not
 * set here: they are inherited from the map root (or `.laneStroke` on a
 * standalone segment), so a consumer class on the lane can override them.
 */
export function laneStrokeProps(
  color: string,
): SVGProps<SVGPathElement> & SVGProps<SVGLineElement> {
  return {
    fill: "none",
    stroke: color,
    vectorEffect: "non-scaling-stroke",
  };
}

export interface ISpacelaneSegmentProps {
  origin: IPoint;
  destination: IPoint;
  color: string;
  className?: string;
}

/** A single lane segment drawn with the map's default stroke. Renders in any <svg>. */
export function SpacelaneSegment({
  origin,
  destination,
  color,
  className,
}: ISpacelaneSegmentProps) {
  return (
    <line
      className={lib.classNames(styles.laneStroke, className)}
      x1={origin.x}
      y1={origin.y}
      x2={destination.x}
      y2={destination.y}
      {...laneStrokeProps(color)}
    />
  );
}
