import { Icon, IIconProps } from "./Icon";

export function HamburgerMenu(props: IIconProps) {
  return (
    <Icon externalProps={props} viewBoxSize={100}>
      <g>
        <line x1="20" x2="80" y1="20" y2="20" />
        <line x1="20" x2="80" y1="50" y2="50" />
        <line x1="20" x2="80" y1="80" y2="80" />
      </g>
    </Icon>
  );
}
