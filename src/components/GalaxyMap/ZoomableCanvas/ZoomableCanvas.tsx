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

  const handlersRef = useRef(props.handlers);
  handlersRef.current = props.handlers;

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

  // React attaches wheel/touchstart/touchmove listeners as passive by
  // default, so calling e.preventDefault() inside a JSX onWheel/onTouchMove
  // handler is silently ignored by the browser — the page still scrolls or
  // pinch-zooms underneath regardless. These three are attached manually
  // with { passive: false } instead, which is the only way to actually
  // suppress the native gesture. A ref (not props.handlers directly) keeps
  // this effect running once at mount rather than re-attaching listeners
  // on every render (props.handlers is a new object every render).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      handlersRef.current.onWheel(e as unknown as React.WheelEvent<SVGSVGElement>);
    }
    function handleTouchStart(e: TouchEvent) {
      e.preventDefault();
      handlersRef.current.onTouchStart(
        e as unknown as React.TouchEvent<SVGSVGElement>,
      );
    }
    function handleTouchMove(e: TouchEvent) {
      e.preventDefault();
      handlersRef.current.onTouchMove(
        e as unknown as React.TouchEvent<SVGSVGElement>,
      );
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  const svgTransform = `translate(${size.width / 2}, ${size.height / 2}) scale(${props.zoom}, ${-props.zoom}) translate(${-props.center.x}, ${-props.center.y})`;

  return (
    <svg
      ref={svgRef}
      className={styles.canvas}
      onMouseDown={props.handlers.onMouseDown}
      onMouseMove={props.handlers.onMouseMove}
      onMouseUp={props.handlers.onMouseUp}
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
