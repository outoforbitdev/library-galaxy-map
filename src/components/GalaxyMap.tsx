"use client";

import ZoomableMap from "./ZoomableMap";
import { IMapOptions, MapOption, MapOptions } from "./MapOptions";
import { useRef, useState } from "react";
import { IPlanet } from "./PlanetMap";
import { ISpacelane } from "./SpacelaneMap";
import styles from "./map.module.css";

export interface IMapProps {
  planets: IPlanet[];
  spacelanes: ISpacelane[];
  dimensions: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  mapOptions?: IMapOptions;
  zoom?: {
    initial?: number;
    min?: number;
    max?: number;
  };
}

export default function Map(props: IMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hidePlanetLabels, setHidePlanetLabels] = useState(
    props.mapOptions?.hidePlanetLabels ?? false,
  );
  const [hideSpacelaneLabels, setHideSpacelaneLabels] = useState(
    props.mapOptions?.hideSpacelaneLabels ?? false,
  );
  const [showAllPlanets, setShowAllPlanets] = useState(
    props.mapOptions?.showAllPlanets ?? false,
  );
  const [showAllSpacelanes, setShowAllSpacelanes] = useState(
    props.mapOptions?.showAllSpacelanes ?? false,
  );

  const mapOptions = createMapOptions(
    hidePlanetLabels,
    setHidePlanetLabels,
    hideSpacelaneLabels,
    setHideSpacelaneLabels,
    showAllPlanets,
    setShowAllPlanets,
    showAllSpacelanes,
    setShowAllSpacelanes,
    props.mapOptions?.customOptions || [],
  );

  const mapOptionsProps: IMapOptions = {};
  mapOptionsProps.hidePlanetLabels = hidePlanetLabels;
  mapOptionsProps.hideSpacelaneLabels = hideSpacelaneLabels;
  mapOptionsProps.showAllPlanets = showAllPlanets;
  mapOptionsProps.showAllSpacelanes = showAllSpacelanes;

  return (
    <div ref={containerRef} className={styles.container}>
      <MapOptions mapOptions={mapOptions} />
      <ZoomableMap
        containerRef={containerRef}
        {...props}
        mapOptions={mapOptionsProps}
        zoom={props.zoom ?? {}}
      />
    </div>
  );
}

function createMapOptions(
  hidePlanetLabels: boolean,
  setHidePlanetLabels: (value: boolean) => void,
  hideSpacelaneLabels: boolean,
  setHideSpacelaneLabels: (value: boolean) => void,
  showAllPlanets: boolean,
  setShowAllPlanets: (value: boolean) => void,
  showAllSpacelanes: boolean,
  setShowAllSpacelanes: (value: boolean) => void,
  clientMapOptions: MapOption[],
) {
  const defaultOptions: MapOption[] = [
    createSingleMapOption(
      hidePlanetLabels,
      setHidePlanetLabels,
      "Hide planet labels",
      "checkbox",
    ),
    createSingleMapOption(
      hideSpacelaneLabels,
      setHideSpacelaneLabels,
      "Hide spacelane labels",
      "checkbox",
    ),
    createSingleMapOption(
      showAllPlanets,
      setShowAllPlanets,
      "Show all planets",
      "checkbox",
    ),
    createSingleMapOption(
      showAllSpacelanes,
      setShowAllSpacelanes,
      "Show all spacelanes",
      "checkbox",
    ),
  ];

  return defaultOptions.concat(clientMapOptions);
}

function createSingleMapOption<T>(
  value: T,
  setValue: (value: T) => void,
  label: string,
  inputType: string,
) {
  return {
    currentValue: value,
    setValue: setValue,
    label: label,
    inputType: inputType,
  };
}
