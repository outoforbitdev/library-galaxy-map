import { Icon, IIconProps } from "./Icon";

export function X(props: IIconProps) {
  return (
    <Icon externalProps={props} viewBoxSize={100}>
      <g>
        <line x1="20" x2="80" y1="20" y2="80" />
        <line x1="80" x2="20" y1="20" y2="80" />
      </g>
    </Icon>
  );
}
