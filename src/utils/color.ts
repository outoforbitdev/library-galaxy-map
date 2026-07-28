import { MapColor } from "../types";

export function colorToCss(color: MapColor): string {
  return `var(--ood-color-${MapColor[color].toLowerCase()})`;
}
