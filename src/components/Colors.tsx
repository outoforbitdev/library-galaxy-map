export enum MapColor {
  Gray,
  Red,
  Blue,
  Green,
  Yellow,
  Magenta,
  Aqua,
}

export function colorToCss(color: MapColor) {
  const colorName = color.toString().toLowerCase();

  return `var(--color-${colorName})`;
}
