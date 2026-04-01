import React, { useEffect, useRef, useState } from "react";
import ViewportController from "./ViewportController";
import MapPlanet, { IPlanet } from "./MapPlanet";
import MapLabel from "./MapLabel";
import MapSpacelane, { ISpacelane } from "./MapSpacelane";
import styles from "../styles/mapcontainers.module.css";
import zoomStyles from "../styles/zoom.module.css";
import { IVector2 } from "./Vector2";

type MinMaxCoordinates = { min: IVector2; max: IVector2 };

export interface IMapSvgProps {
  planets: IPlanet[];
  spacelanes: ISpacelane[];
  zoom?: {
    initial?: number;
    min?: number;
    max?: number;
  };
  center?: IVector2;
  onPlanetSelect?: (planetId: string) => void;
  selectedPlanetId?: string;
}

export default function MapSvg(props: IMapSvgProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const transformGroupRef = useRef<SVGGElement>(null);
  const [containerDimensions, setContainerDimensions] = useState<IVector2>({
    x: 800,
    y: 800,
  });
  const mapRef = useRef({
    zoomFactor: props.zoom?.initial || 1,
    center: props.center || { x: 0, y: 0 },
    minMaxCoordinates: getMinMaxCoordinates(
      props.center || { x: 0, y: 0 },
      props.zoom?.initial || 1,
      containerDimensions,
    ),
  });
  const [planetsToRender, setPlanetsToRender] = useState<IPlanet[]>([]);
  const planetsToLabelRef = useRef<IPlanet[]>([]);
  const planetsRef = useRef<IPlanet[]>(props.planets);
  planetsRef.current = props.planets;
  const labelGroupRef = useRef<SVGGElement>(null);
  const planetGroupRef = useRef<SVGGElement>(null);
  const selectedPlanetIdRef = useRef(props.selectedPlanetId);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | undefined>(
    props.selectedPlanetId,
  );

  useEffect(() => {
    if (containerRef.current) {
      const newContainerDimensions = {
        x: containerRef.current.getBoundingClientRect().width,
        y: containerRef.current.getBoundingClientRect().height,
      };
      setContainerDimensions(newContainerDimensions);
      const newMinMaxCoordinates = getMinMaxCoordinates(
        mapRef.current.center,
        mapRef.current.zoomFactor,
        newContainerDimensions,
      );
      mapRef.current.minMaxCoordinates = newMinMaxCoordinates;
      getAndSetComponentsToRender(
        newMinMaxCoordinates,
        mapRef.current.zoomFactor,
        planetsRef,
        setPlanetsToRender,
        planetsToLabelRef,
        props.selectedPlanetId,
      );
    }

    selectedPlanetIdRef.current = props.selectedPlanetId;
  }, [containerRef, planetsRef.current, props.selectedPlanetId]);

  const zoomStyle = getZoomStyle(mapRef.current.zoomFactor);

  const onDrag = function (delta: IVector2) {
    const oldCenterCoordinates = mapRef.current.center;
    const newCenterCoordinates = {
      x: oldCenterCoordinates.x - delta.x / mapRef.current.zoomFactor,
      y: oldCenterCoordinates.y + delta.y / mapRef.current.zoomFactor,
    };

    mapRef.current.center = newCenterCoordinates;

    const newMinMaxCoordinates = getMinMaxCoordinates(
      newCenterCoordinates,
      mapRef.current.zoomFactor,
      containerDimensions,
    );
    mapRef.current.minMaxCoordinates = newMinMaxCoordinates;

    transformGroupRef.current?.setAttribute(
      "transform",
      `scale(${mapRef.current.zoomFactor} -${mapRef.current.zoomFactor}) translate(${-newCenterCoordinates.x} ${-newCenterCoordinates.y})`,
    );
    updateLabelPositions(
      labelGroupRef,
      planetsToLabelRef,
      containerDimensions,
      mapRef.current.zoomFactor,
      mapRef.current.center,
    );
  };

  const onZoomChange = function (
    newZoomFactor: number,
    mouseContainerPosition: IVector2,
  ) {
    if (!containerRef.current) return;

    const svg = containerRef.current;

    const oldZoomFactor = mapRef.current.zoomFactor;
    const oldCenterCoordinates = mapRef.current.center;

    const mouseMapCoordinates = containerPositionToMapCoordinates(
      mouseContainerPosition,
      svg,
      oldZoomFactor,
      oldCenterCoordinates,
    );

    const oldMouseCoordinateOffset = {
      x: oldCenterCoordinates.x - mouseMapCoordinates.x,
      y: oldCenterCoordinates.y - mouseMapCoordinates.y,
    };

    const newMouseCoordinateOffset = {
      x: (oldMouseCoordinateOffset.x / newZoomFactor) * oldZoomFactor,
      y: (oldMouseCoordinateOffset.y / newZoomFactor) * oldZoomFactor,
    };

    const newCenterCoordinates = {
      x: mouseMapCoordinates.x + newMouseCoordinateOffset.x,
      y: mouseMapCoordinates.y + newMouseCoordinateOffset.y,
    };

    const newMinMaxCoordinates = getMinMaxCoordinates(
      newCenterCoordinates,
      newZoomFactor,
      containerDimensions,
    );
    mapRef.current = {
      center: newCenterCoordinates,
      minMaxCoordinates: newMinMaxCoordinates,
      zoomFactor: newZoomFactor,
    };

    transformGroupRef.current?.setAttribute(
      "transform",
      `scale(${newZoomFactor} -${newZoomFactor}) translate(${-newCenterCoordinates.x} ${-newCenterCoordinates.y})`,
    );
    updateLabelPositions(
      labelGroupRef,
      planetsToLabelRef,
      containerDimensions,
      mapRef.current.zoomFactor,
      mapRef.current.center,
    );
  };

  function onZoomEnd() {
    getAndSetComponentsToRender(
      mapRef.current.minMaxCoordinates,
      mapRef.current.zoomFactor,
      planetsRef,
      setPlanetsToRender,
      planetsToLabelRef,
      selectedPlanetIdRef.current,
    );
  }

  function onDragEnd() {
    getAndSetComponentsToRender(
      mapRef.current.minMaxCoordinates,
      mapRef.current.zoomFactor,
      planetsRef,
      setPlanetsToRender,
      planetsToLabelRef,
      selectedPlanetIdRef.current,
    );
  }

  return (
    <ViewportController
      onDragMove={onDrag}
      onDragEnd={onDragEnd}
      className={styles.mapSvgContainer}
      onZoomChange={onZoomChange}
      onZoomEnd={onZoomEnd}
      maxZoom={32}
      minZoom={0.01}
      initialZoom={props.zoom?.initial || 1}
    >
      <svg
        ref={containerRef}
        viewBox={`${containerDimensions.x / -2} ${containerDimensions.y / -2} ${containerDimensions.x} ${containerDimensions.y}`}
        className={zoomStyle + " " + styles.mapSvg}
      >
        <g
          ref={transformGroupRef}
          transform={`scale(${mapRef.current.zoomFactor} -${mapRef.current.zoomFactor}) translate(${-mapRef.current.center.x} ${-mapRef.current.center.y})`}
        >
          {props.spacelanes.map((spacelane) => (
            <MapSpacelane
              key={
                spacelane.id +
                "-" +
                spacelane.xOne +
                "-" +
                spacelane.yOne +
                "-" +
                spacelane.xTwo +
                "-" +
                spacelane.yTwo
              }
              spacelane={spacelane}
            />
          ))}
          <g ref={planetGroupRef}>
            {planetsToRender.map((planet) => (
              <MapPlanet
                planet={planet}
                key={planet.id}
                onClick={props.onPlanetSelect}
              />
            ))}
            {props.selectedPlanetId ? (
              <MapPlanet
                planet={
                  planetsToRender.find(
                    (value) => value.id === props.selectedPlanetId,
                  )!
                }
                onClick={props.onPlanetSelect}
                selected
              />
            ) : null}
          </g>
        </g>
        <g ref={labelGroupRef}>
          {planetsToLabelRef.current.map((planet) => {
            const screenPosition = mapCoordinatesToContainerPosition(
              planet.coordinates,
              containerDimensions,
              mapRef.current.zoomFactor,
              mapRef.current.center,
            );

            return (
              <MapLabel
                key={planet.id}
                coordinates={{
                  x: screenPosition.x - containerDimensions.x / 2,
                  y: screenPosition.y - containerDimensions.y / 2,
                }}
                id={planet.id}
                label={planet.name}
                color={planet.color}
                onClick={props.onPlanetSelect}
              />
            );
          })}
        </g>
      </svg>
    </ViewportController>
  );
}

function getZoomStyle(zoomFactor: number) {
  let zoomStyle;
  if (zoomFactor > 24) {
    zoomStyle = zoomStyles.zoom3200;
  } else if (zoomFactor > 12) {
    zoomStyle = zoomStyles.zoom1600;
  } else if (zoomFactor > 6) {
    zoomStyle = zoomStyles.zoom800;
  } else if (zoomFactor > 3) {
    zoomStyle = zoomStyles.zoom400;
  } else if (zoomFactor > 1.5) {
    zoomStyle = zoomStyles.zoom200;
  } else if (zoomFactor > 0.75) {
    zoomStyle = zoomStyles.zoom100;
  } else if (zoomFactor > 0.38) {
    zoomStyle = zoomStyles.zoom50;
  } else if (zoomFactor > 0.2) {
    zoomStyle = zoomStyles.zoom25;
  } else if (zoomFactor > 0.125) {
    zoomStyle = zoomStyles.zoom15;
  } else if (zoomFactor > 0.075) {
    zoomStyle = zoomStyles.zoom10;
  } else if (zoomFactor > 0.04) {
    zoomStyle = zoomStyles.zoom05;
  } else if (zoomFactor > 0.025) {
    zoomStyle = zoomStyles.zoom03;
  } else if (zoomFactor > 0.015) {
    zoomStyle = zoomStyles.zoom02;
  } else {
    zoomStyle = zoomStyles.zoom01;
  }
  return zoomStyle;
}

function getMinMaxCoordinates(
  centerCoordinates: IVector2,
  zoomFactor: number,
  containerDimensions: IVector2,
): MinMaxCoordinates {
  const min = {
    x: centerCoordinates.x - containerDimensions.x / zoomFactor / 2,
    y: centerCoordinates.y - containerDimensions.y / zoomFactor / 2,
  };
  const max = {
    x: centerCoordinates.x + containerDimensions.x / zoomFactor / 2,
    y: centerCoordinates.y + containerDimensions.y / zoomFactor / 2,
  };

  return { min, max };
}

function isCoordinateWithinMinMax(
  coordinate: IVector2,
  minMaxCoordinates: MinMaxCoordinates,
) {
  const ret =
    coordinate.x > minMaxCoordinates.min.x &&
    coordinate.x < minMaxCoordinates.max.x &&
    coordinate.y > minMaxCoordinates.min.y &&
    coordinate.y < minMaxCoordinates.max.y;

  return ret;
}

function shouldCoordinateBeRendered(
  coordinate: IVector2,
  minMaxCoordinates: MinMaxCoordinates,
) {
  const dimensions = {
    x: minMaxCoordinates.max.x - minMaxCoordinates.min.x,
    y: minMaxCoordinates.max.y - minMaxCoordinates.min.y,
  };
  const renderWindow = {
    min: {
      x: minMaxCoordinates.min.x - dimensions.x / 2,
      y: minMaxCoordinates.min.y - dimensions.y / 2,
    },
    max: {
      x: minMaxCoordinates.max.x + dimensions.x / 2,
      y: minMaxCoordinates.max.y + dimensions.y / 2,
    },
  };

  return isCoordinateWithinMinMax(coordinate, renderWindow);
}

function containerPositionToMapCoordinates(
  containerPosition: IVector2,
  svg: SVGSVGElement,
  zoom: number,
  centerCoordinates: IVector2,
) {
  const rect = svg.getBoundingClientRect();

  const pixelsFromCenter = {
    x: rect.width / 2 - containerPosition.x,
    y: rect.height / 2 - containerPosition.y,
  };

  const mapCoordinates = {
    x: centerCoordinates.x - pixelsFromCenter.x / zoom,
    y: centerCoordinates.y + pixelsFromCenter.y / zoom,
  };

  return mapCoordinates;
}

function mapCoordinatesToContainerPosition(
  mapCoordinates: IVector2,
  containerDimensions: IVector2,
  zoom: number,
  centerCoordinates: IVector2,
): IVector2 {
  return {
    x:
      containerDimensions.x / 2 +
      (mapCoordinates.x - centerCoordinates.x) * zoom,
    y:
      containerDimensions.y / 2 -
      (mapCoordinates.y - centerCoordinates.y) * zoom,
  };
}

function getAndSetComponentsToRender(
  minMaxCoordinates: MinMaxCoordinates,
  zoomFactor: number,
  planets: React.RefObject<IPlanet[]>,
  setPlanetsToRender: (planets: IPlanet[]) => void,
  labelsToRenderRef: React.RefObject<IPlanet[]>,
  selectedPlanetId?: string,
): void {
  const planetsToRender = planets.current.filter((planet) =>
    shouldCoordinateBeRendered(planet.coordinates, minMaxCoordinates),
  );

  const labels: { x: number; y: number; planet: string }[] = [];
  if (selectedPlanetId) {
    const selectedPlanet = planets.current.find(
      (value) => value.id === selectedPlanetId,
    );
    if (selectedPlanet) {
      labels.push({
        x: selectedPlanet.coordinates.x,
        y: selectedPlanet.coordinates.y,
        planet: selectedPlanet.name,
      });
    }
  }
  const planetsToLabel: IPlanet[] = planetsToRender.filter((planet) => {
    if (planet.id === selectedPlanetId) {
      return true;
    }
    const { x, y } = planet.coordinates;
    const xMin = x - 120 / zoomFactor;
    const xMax = x + 120 / zoomFactor;
    const yMin = y - 10 / zoomFactor;
    const yMax = y + 10 / zoomFactor;
    const collisions = labels.filter(
      (collision) =>
        xMin < collision.x &&
        collision.x < xMax &&
        yMin < collision.y &&
        collision.y < yMax,
    );
    if (collisions.length === 0) {
      labels.push({ ...planet.coordinates, planet: planet.name });
      return true;
    }
    return false;
  });

  setPlanetsToRender(planetsToRender);
  labelsToRenderRef.current = planetsToLabel;
}

function updateLabelPositions(
  labelGroupRef: React.RefObject<SVGGElement | null>,
  planetsToLabelRef: React.RefObject<IPlanet[]>,
  containerDimensions: IVector2,
  zoomFactor: number,
  centerCoordinates: IVector2,
) {
  if (!labelGroupRef.current) return;

  const planetsToLabel = planetsToLabelRef.current;

  const labels = labelGroupRef.current.children;

  for (let i = 0; i < labels.length; i++) {
    const groupElement = labels[i] as SVGGElement;
    const textElement = groupElement.children[0] as SVGTextElement;
    const planet = planetsToLabel[i];
    if (!planet) continue;

    const screenPosition = mapCoordinatesToContainerPosition(
      planet.coordinates,
      containerDimensions,
      zoomFactor,
      centerCoordinates,
    );

    textElement.setAttribute(
      "x",
      String(screenPosition.x - containerDimensions.x / 2 + 10),
    );
    textElement.setAttribute(
      "y",
      String(screenPosition.y - containerDimensions.y / 2 + 5),
    );
  }
}
