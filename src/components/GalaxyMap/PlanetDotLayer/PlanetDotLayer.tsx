import { RefObject, useEffect, useState } from "react";
import { IPlanet } from "../../../types";
import { colorToCss } from "../../../utils/color";
import { orderForRendering } from "../../../utils/orderForRendering";
import { PLANET_SIZE_DEBOUNCE_MS } from "../constants";
import styles from "./PlanetDotLayer.module.css";

export interface IPlanetDotLayerProps {
  planets: IPlanet[];
  zoom: number;
  selectedPlanetId?: string;
  onPlanetSelect?: (planet: IPlanet) => void;
  isDragging: RefObject<boolean>;
}

function computeZoomBucket(zoom: number): string {
  if (zoom < 0.5) return styles.zoomBucketXs;
  if (zoom < 1) return styles.zoomBucketSm;
  if (zoom < 2) return styles.zoomBucketMd;
  if (zoom < 4) return styles.zoomBucketLg;
  return styles.zoomBucketXl;
}

export function PlanetDotLayer(props: IPlanetDotLayerProps) {
  const [zoomBucketClass, setZoomBucketClass] = useState(() =>
    computeZoomBucket(props.zoom),
  );

  useEffect(() => {
    const id = setTimeout(() => {
      setZoomBucketClass(computeZoomBucket(props.zoom));
    }, PLANET_SIZE_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [props.zoom]);

  const ordered = orderForRendering(props.planets, props.selectedPlanetId);

  return (
    <g data-testid="planet-dot-layer" className={zoomBucketClass}>
      {ordered.map((planet) => (
        <circle
          key={planet.id}
          data-testid={`planet-dot-${planet.id}`}
          cx={planet.position.x}
          cy={planet.position.y}
          fill={colorToCss(planet.color)}
          onClick={() => {
            if (!props.isDragging.current) {
              props.onPlanetSelect?.(planet);
            }
          }}
        />
      ))}
    </g>
  );
}
