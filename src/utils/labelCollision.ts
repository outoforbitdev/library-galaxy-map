import { IPlanet } from "../types";

export interface LabelBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const CHAR_WIDTH_PX = 7;
const LABEL_HEIGHT_PX = 14;
const LABEL_OFFSET_X = 10;
const LABEL_OFFSET_Y = -5;

export function estimateLabelBox(planet: IPlanet, zoom: number): LabelBox {
  const w = (planet.name.length * CHAR_WIDTH_PX) / zoom;
  const h = LABEL_HEIGHT_PX / zoom;
  const offsetX = LABEL_OFFSET_X / zoom;
  const offsetY = LABEL_OFFSET_Y / zoom;
  return {
    x: planet.position.x + offsetX,
    y: planet.position.y + offsetY - h,
    w,
    h,
  };
}

export function computeLabelSet(
  planets: IPlanet[],
  limit: number,
  zoom: number,
  selectedPlanetId?: string,
): Set<string> {
  const selected = planets.find((p) => p.id === selectedPlanetId);
  const others = selected
    ? planets.filter((p) => p.id !== selectedPlanetId)
    : planets;
  const candidates = selected
    ? [selected, ...others.slice(0, limit)]
    : others.slice(0, limit);

  const placed: LabelBox[] = [];
  const result = new Set<string>();

  for (const planet of candidates) {
    const box = estimateLabelBox(planet, zoom);
    if (!overlapsAny(box, placed)) {
      result.add(planet.id);
      placed.push(box);
    }
  }

  return result;
}

export function overlapsAny(box: LabelBox, placed: LabelBox[]): boolean {
  return placed.some(
    (p) =>
      box.x < p.x + p.w &&
      box.x + box.w > p.x &&
      box.y < p.y + p.h &&
      box.y + box.h > p.y,
  );
}
