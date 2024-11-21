import classNames from "./classNames";
import { getDomProps, IComponentProps } from "./IComponent";
import styles from "./nav.module.css";

export interface INavLinkProps extends IComponentProps {
  to: string;
}

export function NavLink(props: INavLinkProps) {
  return (
    <a href={props.to} {...getDomProps(props, styles.nav, styles.item)}>
      {props.children}
    </a>
  );
}
