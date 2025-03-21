import styles from "../styles/items.module.css";

export enum FocusLevel {
  Primary,
  Secondary,
  Tertiary,
  Quaternary,
}

export function getFocusClassName(focusLevel: string | FocusLevel): string {
  switch (FocusLevel[focusLevel as keyof typeof FocusLevel]) {
    case FocusLevel.Primary:
      return styles.primary;
    case FocusLevel.Secondary:
      return styles.secondary;
    case FocusLevel.Tertiary:
      return styles.tertiary;
    default:
      return styles.quaternary;
  }
}
