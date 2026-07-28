import { Expandable } from "@outoforbitdev/ood-react";
import { ILegendEntry, MapColor } from "../../../types";
import { colorToCss } from "../../../utils/color";
import styles from "./MapLegend.module.css";

export interface IMapLegendProps {
  legendEntries?: ILegendEntry[];
}

// TODO: ood-react's Expandable always starts collapsed and has no way to
// seed an initial expanded value. Once it gains that capability (e.g. a
// defaultExpanded prop), use it to restore the responsive
// expanded-on-large-screens default described in the TDD (§ Panel
// initial collapse state is responsive) instead of always starting
// collapsed. See decisions.md.
export function MapLegend(props: IMapLegendProps) {
  if (!props.legendEntries || props.legendEntries.length === 0) {
    return null;
  }

  return (
    <Expandable
      title="Legend"
      titleAlwaysVisible
      className={`${styles.legend} ood-accent-block`}
    >
      {props.legendEntries.map((entry) => (
        <span key={entry.id} className={styles.entry}>
          <LegendIndicator color={entry.color} />
          {entry.label}
        </span>
      ))}
    </Expandable>
  );
}

function LegendIndicator(props: { color: MapColor }) {
  const color = colorToCss(props.color);
  return (
    <svg
      className={styles.indicator}
      viewBox="0 0 70 30"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1="5"
        y1="15"
        x2="5"
        y2="15"
        stroke={color}
        strokeWidth="10px"
        strokeLinecap="round"
      />
      <line
        x1="5"
        y1="15"
        x2="55"
        y2="15"
        stroke={color}
        strokeWidth="5px"
        strokeLinecap="round"
      />
      <line
        x1="55"
        y1="15"
        x2="55"
        y2="15"
        stroke={color}
        strokeWidth="10px"
        strokeLinecap="round"
      />
    </svg>
  );
}
