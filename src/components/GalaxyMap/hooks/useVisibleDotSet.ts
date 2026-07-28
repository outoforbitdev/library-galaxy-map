import { useEffect, useState } from "react";
import { IPlanet } from "../../../types";
import { computeVisibleDotSet } from "../../../utils/dotCollision";
import { computeZoomCompensatedRadius } from "../PlanetDotLayer/zoomCompensatedRadius";
import { PLANET_SIZE_DEBOUNCE_MS } from "../constants";

/**
 * computeZoomCompensatedRadius returns a CSS r value meant to be applied
 * inside the SVG group scaled by scale(zoom, -zoom) — it's intentionally
 * huge at low zoom and tiny at high zoom so that, once the transform
 * multiplies it back by zoom, the rendered dot settles at roughly the same
 * screen-pixel size regardless of zoom. Overlap testing happens in screen
 * space (planet positions are converted via `position * zoom`), so it needs
 * that same effective on-screen radius, not the raw pre-transform CSS value.
 */
function effectiveScreenRadius(zoom: number): number {
  return computeZoomCompensatedRadius(zoom) * zoom;
}

/**
 * Debounced circle-overlap culling for planet dots, computed independently
 * from PlanetDotLayer's own debounced radius (a deliberately separate,
 * cheap computation rather than a shared one — see decisions.md).
 */
export function useVisibleDotSet(
  planets: IPlanet[],
  zoom: number,
  selectedPlanetId?: string,
): Set<string> {
  const [visibleDotSet, setVisibleDotSet] = useState<Set<string>>(() =>
    computeVisibleDotSet(
      planets,
      effectiveScreenRadius(zoom),
      zoom,
      selectedPlanetId,
    ),
  );

  useEffect(() => {
    const id = setTimeout(() => {
      setVisibleDotSet(
        computeVisibleDotSet(
          planets,
          effectiveScreenRadius(zoom),
          zoom,
          selectedPlanetId,
        ),
      );
    }, PLANET_SIZE_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [planets, zoom, selectedPlanetId]);

  return visibleDotSet;
}
