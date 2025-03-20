import {
  RefObject,
} from "react";
import PlanetMap, { IPlanet } from "./PlanetMap";
import SpacelaneMap, { ISpacelane } from "./SpacelaneMap";
import { IMapOptions } from "./MapOptions";
import { Draggable } from "../oodreact";
import Zoomable from "./Zoomable";

export interface IZoomableMapProps {
  planets: IPlanet[];
  spacelanes: ISpacelane[];
  containerRef: RefObject<HTMLDivElement>;
  dimensions: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  mapOptions: IMapOptions;
  zoom: {
    initial?: number;
    min?: number;
    max?: number;
  };
}

export default function ZoomableMap(props: IZoomableMapProps) {
  const centerX = props.dimensions.minX * -1;
  const centerY = props.dimensions.maxY;
//   console.log("center");
//   console.log(centerX);

  return (
    <Draggable initialPosition={{ x: 0, y: 0 }}>
      <Zoomable dimensions={props.dimensions} zoom={props.zoom} containerRef={props.containerRef}>
        {props.spacelanes.map((s: ISpacelane, _i: number) => (
          <SpacelaneMap
            spacelane={s}
            centerX={centerX}
            centerY={centerY}
            key={_i}
            forceShow={props.mapOptions.showAllSpacelanes}
            hideLabel={props.mapOptions.hideSpacelaneLabels}
            zoomLevel={1}
          />
        ))}
        {props.planets.map((p: IPlanet, _i: number) => (
          <PlanetMap
            planet={p}
            centerX={centerX}
            centerY={centerY}
            forceShow={props.mapOptions.showAllPlanets}
            hideLabel={props.mapOptions.hidePlanetLabels}
            key={_i}
            zoomLevel={1}
          />
        ))}
      </Zoomable>
    </Draggable>
  );
}
