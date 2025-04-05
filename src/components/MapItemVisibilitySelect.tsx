export type MapItemVisibility = "dynamic" | "show" | "hide";

export function MapItemVisibilitySelect(props: {
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
