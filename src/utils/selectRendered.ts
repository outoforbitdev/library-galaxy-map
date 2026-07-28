import { IMapCoordinate, IPlanet, IRenderLimits, ISpacelane } from "../types";
import { IViewport } from "./coordinates";

export function isPlanetInViewport(
  planet: IPlanet,
  viewport: IViewport,
): boolean {
  return (
    planet.position.x >= viewport.minX &&
    planet.position.x <= viewport.maxX &&
    planet.position.y >= viewport.minY &&
    planet.position.y <= viewport.maxY
  );
}

export function isPointInViewport(
  point: IMapCoordinate,
  viewport: IViewport,
): boolean {
  return (
    point.x >= viewport.minX &&
    point.x <= viewport.maxX &&
    point.y >= viewport.minY &&
    point.y <= viewport.maxY
  );
}

export function isSpaceLaneInViewport(
  spacelane: ISpacelane,
  viewport: IViewport,
): boolean {
  return spacelane.segments.some(
    (seg) =>
      isPointInViewport(seg.origin, viewport) ||
      isPointInViewport(seg.destination, viewport),
  );
}

export function selectRendered(
  planets: IPlanet[],
  spacelanes: ISpacelane[],
  limits: IRenderLimits,
  viewport: IViewport,
): { planets: IPlanet[]; spacelanes: ISpacelane[] } {
  return {
    planets: planets
      .filter((p) => isPlanetInViewport(p, viewport))
      .slice(0, limits.planets),
    spacelanes: spacelanes
      .filter((s) => isSpaceLaneInViewport(s, viewport))
      .slice(0, limits.spacelanes),
  };
}
