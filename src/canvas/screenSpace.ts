import styles from "./Canvas.module.css";

/**
 * Counter-scales an element inside a Canvas so its content is drawn at a fixed
 * screen size, with y pointing down. Put it on a group inside another group
 * translated to a world point. The value is the hashed CSS module class name.
 */
export const screenSpaceClassName: string = styles.screenSpace;
