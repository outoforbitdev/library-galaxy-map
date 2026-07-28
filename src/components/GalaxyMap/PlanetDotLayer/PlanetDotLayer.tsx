import { CSSProperties, RefObject, useEffect, useState } from "react";
import { IPlanet } from "../../../types";
import { colorToCss } from "../../../utils/color";
import { orderForRendering } from "../../../utils/orderForRendering";
import { PLANET_SIZE_DEBOUNCE_MS } from "../constants";
import { computeZoomCompensatedRadius } from "./zoomCompensatedRadius";
import styles from "./PlanetDotLayer.module.css";

export interface IPlanetDotLayerProps {
  planets: IPlanet[];
  zoom: number;
  selectedPlanetId?: string;
  onPlanetSelect?: (planet: IPlanet) => void;
  isDragging: RefObject<boolean>;
}

export function PlanetDotLayer(props: IPlanetDotLayerProps) {
  const [radius, setRadius] = useState(() =>
    computeZoomCompensatedRadius(props.zoom),
  );

  useEffect(() => {
    const id = setTimeout(() => {
      setRadius(computeZoomCompensatedRadius(props.zoom));
    }, PLANET_SIZE_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [props.zoom]);

  const ordered = orderForRendering(props.planets, props.selectedPlanetId);

  const style = {
    "--planet-dot-radius": `${radius}px`,
  } as CSSProperties;

  return (
    <g
      data-testid="planet-dot-layer"
      className={styles.layer}
      style={style}
    >
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
