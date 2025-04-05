import { Expandable } from "../oodreact";
import { IComponentProps } from "../oodreact/IComponent";
import styles from "../styles/map.module.css";

export type MapItemVisibility = "dynamic" | "show" | "hide";

export interface IMapOptionsProps extends IComponentProps {
  planetLabelVisibility: MapItemVisibility;
  setPlanetLabels: (value: MapItemVisibility) => void;
  planetVisibility: MapItemVisibility;
  setPlanetVisibility: (value: MapItemVisibility) => void;
  spacelaneVisibility: MapItemVisibility;
  setSpacelaneVisibility: (value: MapItemVisibility) => void;
}

export function MapOptions(props: IMapOptionsProps) {
  return (
    <Expandable className={styles.optionsWindow} title="Map Options">
      <div className={styles.optionsWindowContent}>
        <MapItemVisibilitySelect
          label="Planet Labels"
          defaultValue={props.planetLabelVisibility}
          setVisibility={props.setPlanetLabels}
        />
        <MapItemVisibilitySelect
          label="Planets"
          defaultValue={props.planetVisibility}
          setVisibility={props.setPlanetVisibility}
        />
        <MapItemVisibilitySelect
          label="Spacelanes"
          defaultValue={props.spacelaneVisibility}
          setVisibility={props.setSpacelaneVisibility}
        />
        {props.children}
      </div>
    </Expandable>
  );
}

function MapItemVisibilitySelect(props: {
  label: string;
  defaultValue: MapItemVisibility;
  setVisibility: (value: MapItemVisibility) => void;
}) {
  return (
    <span>
      <label>{props.label}</label>
      <select
        defaultValue={props.defaultValue}
        onChange={(e) =>
          props.setVisibility(GetDefaultMapItemDisplayOption(e.target.value))
        }
      >
        <option value="dynamic">Dynamic</option>
        <option value="show">Show</option>
        <option value="hide">Hide</option>
      </select>
    </span>
  );
}

function GetDefaultMapItemDisplayOption(value: string): MapItemVisibility {
  switch (value) {
    case "dynamic":
      return value;
    case "show":
      return value;
    case "hide":
      return value;
    default:
      return "dynamic";
  }
}
