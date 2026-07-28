import { RefObject, useEffect, useRef, useState } from "react";
import { IMapCoordinate, IPlanet, ISpacelane } from "../../../types";
import { SpacelaneLayer } from "../SpacelaneLayer/SpacelaneLayer";
import { PlanetDotLayer } from "../PlanetDotLayer/PlanetDotLayer";
import { PlanetLabelLayer } from "../PlanetLabelLayer/PlanetLabelLayer";
import { ZoomPanHandlers } from "../hooks/useZoomPan";
import styles from "./ZoomableCanvas.module.css";

export interface IZoomableCanvasProps {
  planets: IPlanet[];
  spacelanes: ISpacelane[];
  labelSet: Set<string>;
  zoom: number;
  center: IMapCoordinate;
  handlers: ZoomPanHandlers;
  isDragging: RefObject<boolean>;
  selectedPlanetId?: string;
  selectedSpaceLaneId?: string;
  onPlanetSelect?: (planet: IPlanet) => void;
  onSpaceLaneSelect?: (spacelane: ISpacelane) => void;
}

export function ZoomableCanvas(props: IZoomableCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const svgTransform = `translate(${size.width / 2}, ${size.height / 2}) scale(${props.zoom}, ${-props.zoom}) translate(${-props.center.x}, ${-props.center.y})`;

  return (
    <svg
      ref={svgRef}
      className={styles.canvas}
      onWheel={props.handlers.onWheel}
      onMouseDown={props.handlers.onMouseDown}
      onMouseMove={props.handlers.onMouseMove}
      onMouseUp={props.handlers.onMouseUp}
      onTouchStart={props.handlers.onTouchStart}
      onTouchMove={props.handlers.onTouchMove}
      onTouchEnd={props.handlers.onTouchEnd}
    >
      <g transform={svgTransform}>
        <SpacelaneLayer
          spacelanes={props.spacelanes}
          selectedSpaceLaneId={props.selectedSpaceLaneId}
          onSpaceLaneSelect={props.onSpaceLaneSelect}
          isDragging={props.isDragging}
        />
        <PlanetDotLayer
          planets={props.planets}
          zoom={props.zoom}
          selectedPlanetId={props.selectedPlanetId}
          onPlanetSelect={props.onPlanetSelect}
          isDragging={props.isDragging}
        />
      </g>
      <PlanetLabelLayer
        planets={props.planets}
        labelSet={props.labelSet}
        selectedPlanetId={props.selectedPlanetId}
        zoom={props.zoom}
        center={props.center}
        svgWidth={size.width}
        svgHeight={size.height}
        onPlanetSelect={props.onPlanetSelect}
        isDragging={props.isDragging}
      />
    </svg>
  );
}
