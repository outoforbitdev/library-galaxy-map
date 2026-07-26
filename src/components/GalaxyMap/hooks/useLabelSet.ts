import { useEffect, useState } from "react";
import { IPlanet } from "../../../types";
import { computeLabelSet } from "../../../utils/labelCollision";
import { LABEL_COLLISION_DEBOUNCE_MS } from "../constants";

export function useLabelSet(
  planets: IPlanet[],
  limit: number,
  zoom: number,
  selectedPlanetId?: string,
): Set<string> {
  const [labelSet, setLabelSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = setTimeout(() => {
      setLabelSet(computeLabelSet(planets, limit, zoom, selectedPlanetId));
    }, LABEL_COLLISION_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [planets, limit, zoom, selectedPlanetId]);

  return labelSet;
}
