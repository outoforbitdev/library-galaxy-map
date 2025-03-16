"use client";

import { useState } from "react";
import { getDomProps, IComponentProps } from "./IComponent";
import { HamburgerMenu, IconSize, X } from "./icons";
import styles from "./nav.module.css";
import { NavLink } from "./NavLink";

export interface INavBarProps extends IComponentProps {
  home?: string;
  homeLabel?: string;
}

export function NavBar(props: INavBarProps) {
  const [responsive, setResponsive] = useState(false);
  return (
    <nav
      {...getDomProps(props, styles.nav, responsive ? styles.responsive : "")}
    >
      {props.home ? (
        <NavLink to={props.home} className={styles.home}>
          {props.homeLabel ?? "Home"}
        </NavLink>
      ) : null}
      {props.children}
      <NavLink
        to="#"
        onClick={() => toggleResponsive(responsive, setResponsive)}
        className={styles.hamburger}
      >
        {responsive ? (
          <X size={IconSize.Large} />
        ) : (
          <HamburgerMenu size={IconSize.Large} />
        )}
      </NavLink>
    </nav>
  );
}

function toggleResponsive(
  responsive: boolean,
  setResponsive: (responsive: boolean) => void,
) {
  setResponsive(!responsive);
}
