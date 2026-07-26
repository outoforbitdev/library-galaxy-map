import { useState } from "react";
import { ILegendEntry, MapColor } from "../../../types";
import { colorToCss } from "../../../utils/color";
import { useInitiallyExpanded } from "../hooks/useInitiallyExpanded";
import styles from "./MapLegend.module.css";

export interface IMapLegendProps {
  legendEntries?: ILegendEntry[];
}

// TODO: migrate to ood-react's Expandable once it supports seeding an
// initial expanded value (see decisions.md § Custom collapsible panels
// instead of ood-react's Expandable).
export function MapLegend(props: IMapLegendProps) {
  const [expanded, setExpanded] = useState(useInitiallyExpanded());

  if (!props.legendEntries || props.legendEntries.length === 0) {
    return null;
  }

  return (
    <div className={styles.legend}>
      <button type="button" onClick={() => setExpanded(!expanded)}>
        Legend
      </button>
      {expanded &&
        props.legendEntries.map((entry) => (
          <span key={entry.id} className={styles.entry}>
            <LegendIndicator color={entry.color} />
            {entry.label}
          </span>
        ))}
    </div>
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
