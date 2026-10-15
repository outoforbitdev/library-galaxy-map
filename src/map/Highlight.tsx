import { lib } from "@outoforbitdev/ood-react";
import { screenSpaceClassName } from "../canvas/screenSpace";
import {
  GLYPH_RADIUS_PX,
  HIGHLIGHT_RING_GAP_PX,
  LANE_HALO_WIDTH_PX,
} from "./constants";
import styles from "./GalaxyMap.module.css";
import { laneHitPath } from "./lanePaths";
import type { ISpacelane, ISystem } from "./types";

export type HighlightTarget =
  | { kind: "system"; system: ISystem }
  | { kind: "lane"; lane: ISpacelane };

export interface IHighlightProps {
  target: HighlightTarget | null;
  variant: "hover" | "focus";
  /** Any CSS color. Without it, the highlight inherits `color` from the map root. */
  color?: string;
}

/** A hover or focus highlight, drawn above everything. It ignores clicks and screen readers. */
export function Highlight({ target, variant, color }: IHighlightProps) {
  if (!target) return null;
  if (target.kind === "system") {
    const ringClass =
      variant === "focus"
        ? lib.classNames(styles.ring, styles.focusRing)
        : styles.ring;
    return (
      <g
        className={styles.highlight}
        transform={`translate(${target.system.position.x} ${target.system.position.y})`}
        aria-hidden="true"
      >
        <g className={screenSpaceClassName}>
          <circle
            className={ringClass}
            r={GLYPH_RADIUS_PX + HIGHLIGHT_RING_GAP_PX}
            color={color}
          />
        </g>
      </g>
    );
  }
  return (
    <path
      className={lib.classNames(styles.highlight, styles.highlightLane)}
      d={laneHitPath(target.lane.segments)}
      color={color}
      strokeWidth={LANE_HALO_WIDTH_PX}
      vectorEffect="non-scaling-stroke"
      aria-hidden="true"
    />
  );
}
