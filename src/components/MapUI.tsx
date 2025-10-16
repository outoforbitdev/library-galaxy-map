import { IComponentProps } from "@outoforbitdev/ood-react";
import { MapOptions, IMapOptionsProps } from "./MapOptions";
import { LegendEntry, MapLegend } from "./MapLegend";
import styles from "../styles/map.module.css";

interface IMapUIProps extends IComponentProps {
  mapOptions: IMapOptionsProps;
  customOptions?: React.ReactNode;
  legendEntries?: LegendEntry[];
}

export function MapUI(props: IMapUIProps) {
  return (
    <div className={styles.mapOverlay}>
      {props.legendEntries && props.legendEntries.length > 0 ? <MapLegend entries={props.legendEntries} /> : null}
      <MapOptions {...props.mapOptions}>{props.customOptions}</MapOptions>
      {props.children}
    </div>
  );
}
