import type { IBounds, IPoint } from "./types";

/**
 * The smallest box containing every point, or null for no points. It loops
 * instead of spreading into Math.min, which throws past about 100,000 arguments.
 */
export function extentOf(points: readonly IPoint[]): IBounds | null {
  if (points.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { x, y } of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}
