import { Icon, IIconProps } from "./Icon";

export function ArrowDown(props: IIconProps) {
  return (
    <Icon externalProps={props} viewBoxSize={100}>
      <g>
        <polyline points="20,35 50,65, 80,35" fill="none" />
      </g>
    </Icon>
  );
}
