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
  const colorName = MapColor[color].toLowerCase();

  return `var(--ood-color-${colorName})`;
}
