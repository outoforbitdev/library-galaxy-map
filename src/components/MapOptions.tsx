import { Expandable } from "../oodreact";
import { IComponentProps } from "../oodreact/IComponent";
import {
  MapItemVisibility,
  MapItemVisibilitySelect,
} from "./MapItemVisibilitySelect";
import styles from "../styles/map.module.css";

export interface IMapOptionsProps extends IComponentProps {
  planetLabelVisibility: MapItemVisibility;
  setPlanetLabels: (value: MapItemVisibility) => void;
  planetVisibility: MapItemVisibility;
  setPlanetVisibility: (value: MapItemVisibility) => void;
  spacelaneVisibility: MapItemVisibility;
  setSpacelaneVisibility: (value: MapItemVisibility) => void;
}

export function MapOptions(props: IMapOptionsProps) {
  const setPlanetVisiblityAndLabelVisibility = function (
    planetVisibility: MapItemVisibility,
  ) {
    props.setPlanetVisibility(planetVisibility);
    if (planetVisibility === "hide") {
      props.setPlanetLabels("hide");
    }
  };
  return (
    <Expandable className={styles.optionsWindow} title="Map Options">
      <div className={styles.optionsWindowContent}>
        <MapItemVisibilitySelect
          label="Planet Labels"
          value={props.planetLabelVisibility}
          setVisibility={props.setPlanetLabels}
          dynamicDisabled={props.planetVisibility === "hide"}
          showDisabled={props.planetVisibility === "hide"}
        />
        <MapItemVisibilitySelect
          label="Planets"
          defaultValue={props.planetVisibility}
          setVisibility={setPlanetVisiblityAndLabelVisibility}
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
