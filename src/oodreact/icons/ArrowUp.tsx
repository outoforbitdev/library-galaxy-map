import { Icon, IIconProps } from "./Icon";

export function ArrowUp(props: IIconProps) {
  return (
    <Icon externalProps={props} viewBoxSize={100}>
      <g>
        <polyline points="20,65 50,35, 80,65" fill="none" />
      </g>
    </Icon>
  );
}
