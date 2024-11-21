import { getDomProps, IComponentProps } from "./IComponent";
import styles from "./nav.module.css";
import { NavLink } from "./NavLink";

export interface INavBarProps extends IComponentProps {
  home?: string;
  homeLabel?: string;
}

export function NavBar(props: INavBarProps) {
  return (
    <nav {...getDomProps(props, styles.nav)}>
      {props.home ? (
        <NavLink to={props.home}>{props.homeLabel ?? "Home"}</NavLink>
      ) : null}
      {props.children}
    </nav>
  );
}
