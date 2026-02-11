import React, { useEffect, useRef, useState } from "react";
import NewZoomable from "./NewZoomable";
import PlanetMap, { IPlanet } from "./PlanetMap";
import { ISpacelane } from "./SpacelaneMap";
import styles from "../styles/newmap.module.css";
import { IVector2 } from "./Vector2";

type MinMaxCoordinates = { min: IVector2; max: IVector2 };

export interface INewSvgMapProps {
  planets: IPlanet[];
  zoom?: {
    initial?: number;
    min?: number;
    max?: number;
  };
  center?: IVector2;
}

export default function NewSvgMap(props: INewSvgMapProps) {
  const containerRef = useRef<SVGSVGElement>(null);
  const [zoomFactor, setZoomFactor] = useState<number>(
    props.zoom?.initial || 1,
  );
  const zoomFactorRef = useRef<number>(zoomFactor);
  const [containerDimensions, setContainerDimensions] = useState<IVector2>({
    x: 800,
    y: 800,
  });
  const [centerCoordinates, setCenterCoordinates] = useState<IVector2>(
    props.center || { x: 0, y: 0 },
  );
  const centerCoordinatesRef = useRef<IVector2>(centerCoordinates);
  const [minMaxCoordinates, setMinMaxCoordinates] = useState<MinMaxCoordinates>(
    getMinMaxCoordinates(centerCoordinates, zoomFactor, containerDimensions),
  );
  const minMaxCoordinatesRef = useRef<MinMaxCoordinates>(minMaxCoordinates);

  useEffect(() => {
    if (containerRef.current) {
      const newContainerDimensions = {
        x: containerRef.current.getBoundingClientRect().width,
        y: containerRef.current.getBoundingClientRect().height,
      };
      setContainerDimensions(newContainerDimensions);
      const newMinMaxCoordinates = getMinMaxCoordinates(
        centerCoordinatesRef.current,
        zoomFactorRef.current,
        newContainerDimensions,
      );
      minMaxCoordinatesRef.current = newMinMaxCoordinates;
      setMinMaxCoordinates(newMinMaxCoordinates);
    }
  }, [containerRef]);

  const zoomStyle = getZoomStyle(zoomFactor);

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
    setCenterCoordinates(newCenterCoordinates);

    const newMinMaxCoordinates = getMinMaxCoordinates(
      newCenterCoordinates,
      newZoomFactor,
      containerDimensions,
    );
    minMaxCoordinatesRef.current = newMinMaxCoordinates;
    setMinMaxCoordinates(newMinMaxCoordinates);
    zoomFactorRef.current = newZoomFactor;
    setZoomFactor(newZoomFactor);
  };

  const planetsToRender = props.planets
    .filter((planet) =>
      isCoordinateWithinMinMax(
        { x: planet.x, y: planet.y },
        minMaxCoordinatesRef.current,
      ),
    )
    .slice(0, 100);

  return (
    <NewZoomable
      onZoomChange={onZoomChange}
      maxZoom={32}
      minZoom={0.01}
      initialZoom={props.zoom?.initial || 1}
    >
      <svg
        ref={containerRef}
        viewBox={`${containerDimensions.x / -2} ${containerDimensions.y / -2} ${containerDimensions.x} ${containerDimensions.y}`}
        className={zoomStyle + " " + styles.map}
      >
        <g
          transform={`scale(${zoomFactor} -${zoomFactor}) translate(${-centerCoordinates.x} ${-centerCoordinates.y})`}
        >
          {planetsToRender.map((planet) => (
            <g key={planet.id}>
              <circle
                cx={planet.x}
                cy={planet.y}
                fill="red"
                className={styles.planet}
              />
              <text
                className={styles.label}
                x={planet.x + 10 / zoomFactor}
                y={planet.y * -1 + 5 / zoomFactor}
                transform={`scale(1 -1)`}
              >
                {planet.name}
              </text>
            </g>
          ))}
          <circle
            cx={centerCoordinates.x}
            cy={centerCoordinates.y}
            className={styles.planet}
            fill="blue"
          />
        </g>
      </svg>
    </NewZoomable>
  );
}

function getZoomStyle(zoomFactor: number) {
  let zoomStyle;
  if (zoomFactor > 24) {
    zoomStyle = styles.zoom3200;
  } else if (zoomFactor > 12) {
    zoomStyle = styles.zoom1600;
  } else if (zoomFactor > 6) {
    zoomStyle = styles.zoom800;
  } else if (zoomFactor > 3) {
    zoomStyle = styles.zoom400;
  } else if (zoomFactor > 1.5) {
    zoomStyle = styles.zoom200;
  } else if (zoomFactor > 0.75) {
    zoomStyle = styles.zoom100;
  } else if (zoomFactor > 0.38) {
    zoomStyle = styles.zoom50;
  } else if (zoomFactor > 0.2) {
    zoomStyle = styles.zoom25;
  } else if (zoomFactor > 0.125) {
    zoomStyle = styles.zoom15;
  } else if (zoomFactor > 0.075) {
    zoomStyle = styles.zoom10;
  } else if (zoomFactor > 0.04) {
    zoomStyle = styles.zoom05;
  } else if (zoomFactor > 0.025) {
    zoomStyle = styles.zoom03;
  } else if (zoomFactor > 0.015) {
    zoomStyle = styles.zoom02;
  } else {
    zoomStyle = styles.zoom01;
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
  if (ret) {
    // console.log(coordinate);
  }
  return ret;
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
