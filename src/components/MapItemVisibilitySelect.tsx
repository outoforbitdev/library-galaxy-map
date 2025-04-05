export type MapItemVisibility = "dynamic" | "show" | "hide";

interface IMapItemVisibilitySelectProps {
  label: string;
  defaultValue?: MapItemVisibility;
  value?: MapItemVisibility;
  setVisibility: (value: MapItemVisibility) => void;
  dynamicDisabled?: boolean;
  showDisabled?: boolean;
  hideDisabled?: boolean;
}

export function MapItemVisibilitySelect(props: IMapItemVisibilitySelectProps) {
  return (
    <span>
      <label>{props.label}</label>
      <select
        defaultValue={props.defaultValue}
        value={props.value}
        onChange={(e) =>
          props.setVisibility(GetDefaultMapItemDisplayOption(e.target.value))
        }
      >
        <option value="dynamic" disabled={props.dynamicDisabled}>
          Dynamic
        </option>
        <option value="show" disabled={props.showDisabled}>
          Show
        </option>
        <option value="hide" disabled={props.hideDisabled}>
          Hide
        </option>
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
