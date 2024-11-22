import { Icon, IIconProps } from "./Icon";

export function DoubleArrowDown(props: IIconProps) {
  return (
    <Icon externalProps={props} viewBoxSize={100}>
      <g>
        <polyline points="20,20 50,50, 80,20" fill="none" />
        <polyline points="20,50 50,80, 80,50" fill="none" />
      </g>
    </Icon>
  );
}
