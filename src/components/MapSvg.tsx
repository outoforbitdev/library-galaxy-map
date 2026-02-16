import React, { useEffect, useRef, useState } from "react";
import ViewportController from "./ViewportController";
import MapPlanet, { IPlanet } from "./MapPlanet";
import MapLabel from "./MapLabel";
import MapSpacelane, { ISpacelane } from "./MapSpacelane";
import styles from "../styles/mapcontainers.module.css"
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
}

export default function MapSvg(props: IMapSvgProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const transformGroupRef = useRef<SVGGElement>(null);
  const zoomFactorRef = useRef<number>(props.zoom?.initial || 1);
  const [containerDimensions, setContainerDimensions] = useState<IVector2>({
    x: 800,
    y: 800,
  });
  const containerDimensionsRef = useRef<IVector2>(containerDimensions);
  const [centerCoordinates, setCenterCoordinates] = useState<IVector2>(
    props.center || { x: 0, y: 0 },
  );
  const centerCoordinatesRef = useRef<IVector2>(centerCoordinates);
  const minMaxCoordinatesRef = useRef<MinMaxCoordinates>(getMinMaxCoordinates(centerCoordinates, zoomFactorRef.current, containerDimensions));
  const [planetsToRender, setPlanetsToRender] = useState<IPlanet[]>([]);
  const [planetsToLabel, setPlanetsToLabel] = useState<IPlanet[]>([]);
  const planetsToLabelRef = useRef<IPlanet[]>([]);
  const planetsRef = useRef<IPlanet[]>(props.planets);
  planetsRef.current = props.planets;
  const labelGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const newContainerDimensions = {
        x: containerRef.current.getBoundingClientRect().width,
        y: containerRef.current.getBoundingClientRect().height,
      };
      setContainerDimensions(newContainerDimensions);
      containerDimensionsRef.current = newContainerDimensions;
      const newMinMaxCoordinates = getMinMaxCoordinates(
        centerCoordinatesRef.current,
        zoomFactorRef.current,
        newContainerDimensions,
      );
      minMaxCoordinatesRef.current = newMinMaxCoordinates;
      getAndSetComponentsToRender(
        newMinMaxCoordinates,
        zoomFactorRef.current,
        planetsRef,
        setPlanetsToRender,
        setPlanetsToLabel,
        planetsToLabelRef
      )
    }
  }, [containerRef, planetsRef.current]);

  const zoomStyle = getZoomStyle(zoomFactorRef.current);

  const onDrag = function (delta: IVector2) {
    const oldCenterCoordinates = centerCoordinatesRef.current;
    const newCenterCoordinates = {
      x: oldCenterCoordinates.x - delta.x / zoomFactorRef.current,
      y: oldCenterCoordinates.y + delta.y / zoomFactorRef.current,
    };

    centerCoordinatesRef.current = newCenterCoordinates;

    const newMinMaxCoordinates = getMinMaxCoordinates(
      newCenterCoordinates,
      zoomFactorRef.current,
      containerDimensions,
    );
    minMaxCoordinatesRef.current = newMinMaxCoordinates;

    transformGroupRef.current?.setAttribute(
      "transform",
      `scale(${zoomFactorRef.current} -${zoomFactorRef.current}) translate(${-newCenterCoordinates.x} ${-newCenterCoordinates.y})`
    );
    updateLabelPositions(
      labelGroupRef,
      planetsToLabelRef,
      containerDimensionsRef,
      zoomFactorRef,
      centerCoordinatesRef
    )
  };

  const onZoomChange = function (
    newZoomFactor: number,
    mouseContainerPosition: IVector2,
  ) {
    if (!containerRef.current) return;

    const svg = containerRef.current;

    const oldZoomFactor = zoomFactorRef.current;
    const oldCenterCoordinates = centerCoordinatesRef.current;

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

    centerCoordinatesRef.current = newCenterCoordinates;

    const newMinMaxCoordinates = getMinMaxCoordinates(
      newCenterCoordinates,
      newZoomFactor,
      containerDimensions,
    );
    minMaxCoordinatesRef.current = newMinMaxCoordinates;
    zoomFactorRef.current = newZoomFactor;

    transformGroupRef.current?.setAttribute(
      "transform",
      `scale(${newZoomFactor} -${newZoomFactor}) translate(${-newCenterCoordinates.x} ${-newCenterCoordinates.y})`
    );
    updateLabelPositions(
      labelGroupRef,
      planetsToLabelRef,
      containerDimensionsRef,
      zoomFactorRef,
      centerCoordinatesRef
    )
  };

  function onZoomEnd() {
    setCenterCoordinates(centerCoordinatesRef.current);
    getAndSetComponentsToRender(
      minMaxCoordinatesRef.current,
      zoomFactorRef.current,
      planetsRef,
      setPlanetsToRender,
      setPlanetsToLabel,
      planetsToLabelRef
    )
  }

  function onDragEnd() {
    setCenterCoordinates(centerCoordinatesRef.current);
    getAndSetComponentsToRender(
      minMaxCoordinatesRef.current,
      zoomFactorRef.current,
      planetsRef,
      setPlanetsToRender,
      setPlanetsToLabel,
      planetsToLabelRef
    )
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
          transform={`scale(${zoomFactorRef.current} -${zoomFactorRef.current}) translate(${-centerCoordinates.x} ${-centerCoordinates.y})`}
        >
          {props.spacelanes.map((spacelane) => (
            <MapSpacelane 
            key={spacelane.id + "-" + spacelane.xOne + "-" + spacelane.yOne + "-" + spacelane.xTwo + "-" + spacelane.yTwo} 
            spacelane={spacelane} />
        ))}
          {planetsToRender.map((planet) => (
            <MapPlanet planet={planet} key={planet.id} hideLabel={!planetsToLabel.includes(planet)} onClick={props.onPlanetSelect} />
          ))}
        </g>
        <g ref={labelGroupRef}>
          {planetsToLabel.map((planet) => {
            const screenPosition = mapCoordinatesToContainerPosition(
              planet.coordinates,
              containerDimensions,
              zoomFactorRef.current,
              centerCoordinates,
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
  setLabelsToRender: (planets: IPlanet[]) => void,
  labelsToRenderRef: React.RefObject<IPlanet[]>,
): void {
  const planetsToRender = planets.current
    .filter((planet) =>
      shouldCoordinateBeRendered(
        planet.coordinates,
        minMaxCoordinates,
      ),
    );

    const labels: { x: number, y: number, planet: string }[] = [];
    const planetsToLabel: IPlanet[] = planetsToRender.slice(0, 100)
    .filter(
      (planet) => {
        const {x, y} = planet.coordinates;
        const xMin = x - 120 / zoomFactor;
        const xMax = x + 120 / zoomFactor;
        const yMin = y - 10 / zoomFactor;
        const yMax = y + 10 / zoomFactor;
        const collisions = labels.filter((collision) => (xMin < collision.x) && (collision.x < xMax) && (yMin < collision.y) && (collision.y < yMax));
        if (collisions.length === 0) {
          labels.push({...planet.coordinates, planet: planet.name});
          return true;
        }
        return false;
      }
    );

    setPlanetsToRender(planetsToRender);
    setLabelsToRender(planetsToLabel);
    labelsToRenderRef.current = planetsToLabel;
}

function updateLabelPositions(
  labelGroupRef: React.RefObject<SVGGElement | null>, 
  planetsToLabelRef: React.RefObject<IPlanet[]>,
  containerDimensionsRef:  React.RefObject<IVector2>,
  zoomFactorRef: React.RefObject<number>,
  centerCoordinatesRef: React.RefObject<IVector2>
) {
  if (!labelGroupRef.current) return;

  const planetsToLabel = planetsToLabelRef.current;
  const containerDimensions = containerDimensionsRef.current;

  const labels = labelGroupRef.current.children;

  for (let i = 0; i < labels.length; i++) {
    const groupElement = labels[i] as SVGGElement;
    const textElement = groupElement.children[0] as SVGTextElement;
    const planet = planetsToLabel[i];
    if (!planet) continue;

    const screenPosition = mapCoordinatesToContainerPosition(
      planet.coordinates,
      containerDimensions,
      zoomFactorRef.current,
      centerCoordinatesRef.current,
    );

    textElement.setAttribute(
      "x",
      String(screenPosition.x - containerDimensions.x / 2 + 10)
    );
    textElement.setAttribute(
      "y",
      String(screenPosition.y - containerDimensions.y / 2 + 5)
    );
  }
}
