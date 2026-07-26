import { ReactNode } from "react";
import { ILegendEntry, IRenderLimits } from "../../../types";
import { MapLegend } from "../MapLegend/MapLegend";
import { MapOptions } from "../MapOptions/MapOptions";
import styles from "./MapOverlay.module.css";

export interface IMapOverlayProps {
  leftChildren?: ReactNode;
  legendEntries?: ILegendEntry[];
  children?: ReactNode;
  currentLimits: IRenderLimits;
  maxLimits: IRenderLimits;
  setCurrentLimits: (limits: IRenderLimits) => void;
  customOptions?: ReactNode;
  rightChildren?: ReactNode;
}

export function MapOverlay(props: IMapOverlayProps) {
  return (
    <div className={styles.overlay}>
      {props.leftChildren}
      <MapLegend legendEntries={props.legendEntries} />
      {props.children && <div className={styles.center}>{props.children}</div>}
      <MapOptions
        currentLimits={props.currentLimits}
        maxLimits={props.maxLimits}
        setCurrentLimits={props.setCurrentLimits}
        customOptions={props.customOptions}
      />
      {props.rightChildren}
    </div>
  );
}
