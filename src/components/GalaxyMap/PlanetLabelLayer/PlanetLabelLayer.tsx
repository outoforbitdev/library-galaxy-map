import { IMapCoordinate, IPlanet } from "../../../types";
import { mapToScreen } from "../../../utils/coordinates";
import { orderForRendering } from "../../../utils/orderForRendering";
import styles from "./PlanetLabelLayer.module.css";

export interface IPlanetLabelLayerProps {
  planets: IPlanet[];
  labelSet: Set<string>;
  selectedPlanetId?: string;
  zoom: number;
  center: IMapCoordinate;
  svgWidth: number;
  svgHeight: number;
}

export function PlanetLabelLayer(props: IPlanetLabelLayerProps) {
  const labeled = orderForRendering(
    props.planets,
    props.selectedPlanetId,
  ).filter((planet) => props.labelSet.has(planet.id));

  return (
    <g data-testid="planet-label-layer">
      {labeled.map((planet) => {
        const { x, y } = mapToScreen(
          planet.position.x,
          planet.position.y,
          props.center,
          props.zoom,
          props.svgWidth,
          props.svgHeight,
        );
        return (
          <text
            key={planet.id}
            data-testid={`planet-label-${planet.id}`}
            x={x}
            y={y}
            className={styles.label}
          >
            {planet.name}
          </text>
        );
      })}
    </g>
  );
}
