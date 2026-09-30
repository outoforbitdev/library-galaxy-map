import { lib } from "@outoforbitdev/ood-react";
import { memo, type ReactNode } from "react";
import { screenSpaceClassName } from "../canvas/screenSpace";
import {
  GLYPH_RADIUS_PX,
  LABEL_OFFSET_PX,
  SELECTION_RING_GAP_PX,
  SYSTEM_HIT_RADIUS_PX,
} from "./constants";
import styles from "./GalaxyMap.module.css";
import { SystemGlyph } from "./primitives";
import type { ISystem } from "./types";

export interface ISystemNodeProps {
  system: ISystem;
  labeled: boolean;
  selected: boolean;
  /** False when selection is disabled: the node becomes role="img". */
  interactive: boolean;
  /** DOM id, referenced by aria-activedescendant. */
  elementId: string;
  renderOverlay?: (system: ISystem) => ReactNode;
  /** Set only on the selection ring, so overlays using currentColor are unaffected. */
  highlightColor?: string;
}

function SystemNodeView({
  system,
  labeled,
  selected,
  interactive,
  elementId,
  renderOverlay,
  highlightColor,
}: ISystemNodeProps) {
  return (
    <g
      id={elementId}
      className={lib.classNames(styles.system, system.className)}
      transform={`translate(${system.position.x} ${system.position.y})`}
      data-kind="system"
      data-id={system.id}
      role={interactive ? "button" : "img"}
      aria-label={system.name}
      aria-pressed={interactive ? selected : undefined}
    >
      <g className={screenSpaceClassName}>
        <circle className={styles.hit} r={SYSTEM_HIT_RADIUS_PX} />
        <SystemGlyph color={system.color} />
        {selected && (
          <circle
            className={styles.ring}
            r={GLYPH_RADIUS_PX + SELECTION_RING_GAP_PX}
            color={highlightColor}
            aria-hidden="true"
          />
        )}
        {renderOverlay?.(system)}
        {labeled && (
          <text className={styles.label} x={LABEL_OFFSET_PX}>
            {system.name}
          </text>
        )}
      </g>
    </g>
  );
}

/** Equal when every field the node draws is equal, so recreated objects do not re-render. */
export function systemNodePropsEqual(
  a: ISystemNodeProps,
  b: ISystemNodeProps,
): boolean {
  return (
    a.labeled === b.labeled &&
    a.selected === b.selected &&
    a.interactive === b.interactive &&
    a.elementId === b.elementId &&
    a.highlightColor === b.highlightColor &&
    a.renderOverlay === b.renderOverlay &&
    a.system.id === b.system.id &&
    a.system.name === b.system.name &&
    a.system.position.x === b.system.position.x &&
    a.system.position.y === b.system.position.y &&
    a.system.color === b.system.color &&
    a.system.className === b.system.className &&
    a.system.data === b.system.data
  );
}

/** One system: hit area, glyph, selection ring, overlay, then label. */
export const SystemNode = memo(SystemNodeView, systemNodePropsEqual);
