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
      {props.leftChildren && (
        <div className={styles.slot}>{props.leftChildren}</div>
      )}
      <MapLegend legendEntries={props.legendEntries} />
      <div className={styles.center}>
        {props.children && (
          <div className={styles.centerContent}>{props.children}</div>
        )}
      </div>
      <MapOptions
        currentLimits={props.currentLimits}
        maxLimits={props.maxLimits}
        setCurrentLimits={props.setCurrentLimits}
        customOptions={props.customOptions}
      />
      {props.rightChildren && (
        <div className={styles.slot}>{props.rightChildren}</div>
      )}
    </div>
  );
}
