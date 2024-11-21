import {
  useEffect,
  useRef,
  useState,
  WheelEventHandler,
  TouchEventHandler,
  RefObject,
} from "react";
import PlanetMap, { IPlanet } from "./PlanetMap";
import SpacelaneMap, { ISpacelane } from "./SpacelaneMap";
import { IMapOptions } from "./MapOptions";
import { Draggable } from "../oodreact";

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

interface IGenericEvent {
  pageX: number;
  pageY: number;
}

export default function ZoomableMap(props: IZoomableMapProps) {
  //
  // ZOOM PROPERTIES
  //
  const mapWidth = props.dimensions.maxX - props.dimensions.minX;
  const mapHeight = props.dimensions.maxY - props.dimensions.minY;
  const centerX = props.dimensions.minX * -1;
  const centerY = props.dimensions.maxY;
  const mapRef = useRef<SVGSVGElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(props.zoom.initial ?? 1);
  const previousPointerDiff = useRef(-1);
  const initialPointerPosition = useRef({ pageX: 0, pageY: 0 });

  //
  // ZOOM FUNCTIONS
  //
  useEffect(() => {
    if (props.containerRef.current) {
      const container = props.containerRef.current.getBoundingClientRect();
      setOffsetX((container.width - mapWidth) / 2);
      setOffsetY((container.height - mapHeight) / 2);
    }
  }, []);

  const onPointerDown: TouchEventHandler<SVGElement> = function (event) {
    if (event.touches.length !== 2) return;
    previousPointerDiff.current = Math.abs(
      event.touches[0].pageX - event.touches[1].pageX,
    );
    initialPointerPosition.current = {
      pageX: (event.touches[0].pageX + event.touches[1].pageX) / 2,
      pageY: (event.touches[0].pageY + event.touches[1].pageY) / 2,
    };
  };

  const onPointerMove: TouchEventHandler<SVGElement> = function (event) {
    if (event.touches.length !== 2) return;
    const currentDiff = Math.abs(
      event.touches[0].pageX - event.touches[1].pageX,
    );
    if (previousPointerDiff.current > 0) {
      const scaleConstant = 5;
      if (currentDiff > previousPointerDiff.current) {
        adjustZoom(-scaleConstant, initialPointerPosition.current);
      } else if (currentDiff < previousPointerDiff.current) {
        adjustZoom(scaleConstant, initialPointerPosition.current);
      }
    }
    previousPointerDiff.current = currentDiff;
  };

  const onPointerUp: TouchEventHandler<SVGElement> = function (_event) {
    previousPointerDiff.current = -1;
  };

  const onWheel: WheelEventHandler<SVGElement> = function (e) {
    adjustZoom(e.deltaY * 0.2, e);
  };

  const adjustZoom = function (scrollDistance: number, event: IGenericEvent) {
    if (!mapRef.current) return;

    // Set zoom level
    let newZoomLevel = zoomLevel + scrollDistance;
    newZoomLevel = Math.min(newZoomLevel, props.zoom.max ?? newZoomLevel);
    newZoomLevel = Math.max(newZoomLevel, props.zoom.min ?? newZoomLevel);
    setZoomLevel(newZoomLevel);

    const oldZoomModifier = zoomLevelToModifier(zoomLevel);
    const newZoomModifier = zoomLevelToModifier(newZoomLevel);

    // Adjust offset to keep map centered on mouse
    const oldMousePixel = mouseToPixel(
      event,
      mapRef.current.getBoundingClientRect(),
    );
    const newMousePixel = calculateNewMousePixel(
      oldMousePixel,
      centerX,
      centerY,
      oldZoomModifier,
      newZoomModifier,
    );
    setOffsetX(offsetX + oldMousePixel.x - newMousePixel.x);
    setOffsetY(offsetY + oldMousePixel.y - newMousePixel.y);
  };

  return (
    <Draggable initialPosition={{ x: 0, y: 0 }}>
      <svg
        style={{
          // zIndex: -1,
          position: "relative",
          top: offsetY,
          left: offsetX,
        }}
        color="currentColor"
        fill="currentColor"
        width={`${mapWidth}px`}
        height={`${mapHeight}px`}
        onWheel={onWheel}
        ref={mapRef}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
      >
        {props.spacelanes.map((s: ISpacelane, _i: number) => (
          <SpacelaneMap
            spacelane={s}
            centerX={centerX}
            centerY={centerY}
            key={_i}
            forceShow={props.mapOptions.showAllSpacelanes}
            hideLabel={props.mapOptions.hideSpacelaneLabels}
            zoomLevel={zoomLevel}
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
            zoomLevel={zoomLevel}
          />
        ))}
      </svg>
    </Draggable>
  );
}

function mouseToPixel(
  e: IGenericEvent,
  boundingRect: { x: number; y: number },
) {
  return {
    x: e.pageX - boundingRect.x,
    y: e.pageY - boundingRect.y,
  };
}

export function zoomLevelToModifier(zoomLevel: number) {
  let zoomModifier;
  if (zoomLevel === 0) {
    // No zoom
    zoomModifier = 1;
  } else if (zoomLevel > 0) {
    // Zoom out
    zoomModifier = (10 + zoomLevel) / 10;
  } else {
    // Zoom in
    zoomModifier = 1 + zoomLevel / 100;
  }
  return zoomModifier;
}

function calculateNewMousePixel(
  oldMousePixel: { x: number; y: number },
  centerX: number,
  centerY: number,
  oldZoomModifier: number,
  newZoomModifier: number,
) {
  const oldDistanceToCenter = {
    x: oldMousePixel.x - centerX,
    y: centerY - oldMousePixel.y,
  };
  const newDistanceToCenter = {
    x: (oldDistanceToCenter.x * oldZoomModifier) / newZoomModifier,
    y: (oldDistanceToCenter.y * oldZoomModifier) / newZoomModifier,
  };
  const newMousePixel = {
    x: newDistanceToCenter.x + centerX,
    y: centerY - newDistanceToCenter.y,
  };
  return newMousePixel;
}
