import { IComponentProps } from "@outoforbitdev/ood-react";
import { MapOptions, IMapOptionsProps } from "./MapOptions";
import styles from "../styles/map.module.css";

interface IMapUIProps extends IComponentProps {
  mapOptions: IMapOptionsProps;
  customOptions?: React.ReactNode;
}

export function MapUI(props: IMapUIProps) {
  return (
    <div className={styles.mapOverlay}>
      <MapOptions {...props.mapOptions}>{props.customOptions}</MapOptions>
      {props.children}
    </div>
  );
}
