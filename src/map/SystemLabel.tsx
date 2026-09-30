import { lib } from "@outoforbitdev/ood-react";
import { memo } from "react";
import { screenSpaceClassName } from "../canvas/screenSpace";
import { LABEL_OFFSET_PX } from "./constants";
import styles from "./GalaxyMap.module.css";
import type { ISystem } from "./types";

export interface ISystemLabelProps {
  system: ISystem;
  /** Only sets the pointer cursor. Clicks are handled by the map. */
  interactive: boolean;
}

function SystemLabelView({ system, interactive }: ISystemLabelProps) {
  return (
    <g
      className={lib.classNames(styles.systemLabel, system.className)}
      transform={`translate(${system.position.x} ${system.position.y})`}
      data-kind="system"
      data-id={system.id}
      data-part="label"
      data-interactive={interactive}
      aria-hidden="true"
    >
      <g className={screenSpaceClassName}>
        <text className={styles.label} x={LABEL_OFFSET_PX}>
          {system.name}
        </text>
      </g>
    </g>
  );
}

/** Equal when every field the label draws is equal, so recreated objects do not re-render. */
export function systemLabelPropsEqual(
  a: ISystemLabelProps,
  b: ISystemLabelProps,
): boolean {
  return (
    a.interactive === b.interactive &&
    a.system.id === b.system.id &&
    a.system.name === b.system.name &&
    a.system.position.x === b.system.position.x &&
    a.system.position.y === b.system.position.y &&
    a.system.className === b.system.className
  );
}

/**
 * A system's name. Labels are drawn in their own layer above every glyph, so a
 * lower-priority system's glyph can never cover a label. The label carries the
 * system's id, so clicking it selects the system. The system's own group already
 * names the system for assistive technology, so this is hidden from it.
 */
export const SystemLabel = memo(SystemLabelView, systemLabelPropsEqual);
