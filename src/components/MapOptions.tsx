import { Expandable } from "../oodreact";
import styles from "./map.module.css";

export interface IMapOptions {
  hidePlanetLabels?: boolean;
  hideSpacelaneLabels?: boolean;
  showAllPlanets?: boolean;
  showAllSpacelanes?: boolean;
  customOptions?: MapOption[];
}

interface IMapOption<T> {
  currentValue: T;
  setValue: (value: T) => void;
  label: string;
  inputType: string;
}

export type MapOption = IMapOption<boolean>;

interface IMapOptionProps {
  mapOptions: MapOption[];
}

export function MapOptions(props: IMapOptionProps) {
  return (
    <Expandable className={styles.optionsWindow} title="Map Options">
      <div className={styles.optionsWindowContent}>
        {props.mapOptions.map((p, i) => (
          <span key={i}>
            <input
              type={p.inputType}
              onChange={(event) => p.setValue(event.target.checked)}
              checked={p.currentValue}
            />
            <label>{p.label}</label>
          </span>
        ))}
      </div>
    </Expandable>
  );
}
