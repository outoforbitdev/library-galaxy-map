import { Expandable, IChildlessComponentProps } from "@outoforbitdev/ood-react";

import styles from "../styles/map.module.css";
import { colorToCss, MapColor } from "./Colors";
import PlanetMap from "./PlanetMap";

export interface LegendEntry {
    id: string;
    label: string;
    color: MapColor
}

export interface IMapLegendProps extends IChildlessComponentProps {
    entries?: LegendEntry[];
}

export function MapLegend(props: IMapLegendProps) {
  return (
    <Expandable
      className={`${styles.legendWindow} ood-accent-block`}
      title="Legend"
      titleAlwaysVisible
    >
      {props.entries?.map((entry) => (
        <span key={entry.id}>
            <ExampleMapItem color={entry.color} />
          {entry.label}
        </span>
      ))}
    </Expandable>
  );
}

function ExampleMapItem(props: {color: MapColor}) {
    return (
        <svg height="1rem" viewBox="0 0 70 30" preserveAspectRatio="xMidYMid meet">
            <line x1="5" y1="15" x2="5" y2="15" stroke={colorToCss(props.color)} strokeWidth="10px" strokeLinecap="round" />
            <line x1="5" y1="15" x2="55" y2="15" stroke={colorToCss(props.color)} strokeWidth="5px" strokeLinecap="round" />
            <line x1="55" y1="15" x2="55" y2="15" stroke={colorToCss(props.color)} strokeWidth="10px" strokeLinecap="round" />
        </svg>
    )
}