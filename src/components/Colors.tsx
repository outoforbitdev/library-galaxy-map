export enum MapColor {
  Gray,
  Red,
  Blue,
  Green,
  Yellow,
  Magenta,
  Aqua,
  Brown,
}

export function colorToCss(color: MapColor) {
  const colorName = color.toString().toLowerCase();

  return `var(--ood-color-${colorName})`;
}
