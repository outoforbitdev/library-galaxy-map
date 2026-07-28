import { IPlanet } from "../types";

export interface ScreenPoint {
  x: number;
  y: number;
}

export function overlapsAnyDot(
  point: ScreenPoint,
  radiusPx: number,
  placed: ScreenPoint[],
): boolean {
  return placed.some((p) => {
    const dx = point.x - p.x;
    const dy = point.y - p.y;
    return Math.sqrt(dx * dx + dy * dy) < radiusPx * 2;
  });
}

/**
 * Priority-ordered greedy circle-overlap culling for planet dots, mirroring
 * computeLabelSet's algorithm for labels: candidates are considered in
 * priority order (selected planet first), and a candidate is skipped if its
 * on-screen circle overlaps an already-placed one. Since this only ever
 * removes ids from the input list, the result is always a subset of
 * `planets` — it can never grow the number of rendered dots beyond whatever
 * render cap already produced that list.
 */
export function computeVisibleDotSet(
  planets: IPlanet[],
  radiusPx: number,
  zoom: number,
  selectedPlanetId?: string,
): Set<string> {
  const selected = planets.find((p) => p.id === selectedPlanetId);
  const others = selected
    ? planets.filter((p) => p.id !== selectedPlanetId)
    : planets;
  const candidates = selected ? [selected, ...others] : others;

  const placed: ScreenPoint[] = [];
  const result = new Set<string>();

  for (const planet of candidates) {
    const point: ScreenPoint = {
      x: planet.position.x * zoom,
      y: planet.position.y * zoom,
    };
    if (!overlapsAnyDot(point, radiusPx, placed)) {
      result.add(planet.id);
      placed.push(point);
    }
  }

  return result;
}
