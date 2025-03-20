import {
  useEffect,
  useRef,
  useState,
  WheelEventHandler,
  TouchEventHandler,
  RefObject,
} from "react";
import { IComponentProps } from "../oodreact/IComponent";

export interface IZoomableProps extends IComponentProps {
  containerRef: RefObject<HTMLDivElement>;
  dimensions: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
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

export default function Zoomable(props: IZoomableProps) {
  //
  // ZOOM PROPERTIES
  //
  const svgWidth = props.dimensions.maxX - props.dimensions.minX;
  const svgHeight = props.dimensions.maxY - props.dimensions.minY;
  const svgRef = useRef<SVGSVGElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(
    props.zoom.initial && props.zoom.initial > 0 ? props.zoom.initial : 1,
  );
  const previousPointerDiff = useRef(-1);
  const initialPointerPosition = useRef({ pageX: 0, pageY: 0 });

  //
  // ZOOM FUNCTIONS
  //
  useEffect(() => {
    if (props.containerRef.current) {
      const container = props.containerRef.current.getBoundingClientRect();
      const initialOffsetX = (container.width - svgWidth * zoomLevel) / 2;
      const initialOffsetY = (container.height - svgHeight * zoomLevel) / 2;
      setOffsetX(initialOffsetX);
      setOffsetY(initialOffsetY);
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
      adjustZoom(
        (currentDiff - previousPointerDiff.current) /
          previousPointerDiff.current,
        event.touches[0],
      );
    }
    previousPointerDiff.current = currentDiff;
  };

  const onPointerUp: TouchEventHandler<SVGElement> = function (_event) {
    previousPointerDiff.current = -1;
  };

  const onWheel: WheelEventHandler<SVGElement> = function (e) {
    adjustZoom(e.deltaY * 0.01, e);
  };

  const onClick = function (e: React.MouseEvent<SVGElement, MouseEvent>) {
    adjustZoom(0.1, e);
  };

  const adjustZoom = function (scrollDistance: number, event: IGenericEvent) {
    if (!svgRef.current) return;

    // Set zoom level
    let newZoomLevel = zoomLevel + scrollDistance;
    newZoomLevel = Math.min(newZoomLevel, props.zoom.max ?? newZoomLevel);
    newZoomLevel = Math.max(newZoomLevel, props.zoom.min ?? newZoomLevel);
    setZoomLevel(newZoomLevel);

    // Adjust offset to keep map centered on mouse
    // Get offset between SVG and mouse
    const oldTotalOffset = mouseToTotalOffset(
      event,
      svgRef.current.getBoundingClientRect(),
    );
    // Calculate new offset between SVG and mouse based on zoom level
    const newTotalOffset = calculateNewTotalOffset(
      oldTotalOffset,
      zoomLevel,
      newZoomLevel,
    );
    // Set SVG offset from container to maintain achieve new offset between SVG and mouse
    setOffsetX(offsetX + oldTotalOffset.x - newTotalOffset.x);
    setOffsetY(offsetY + oldTotalOffset.y - newTotalOffset.y);
  };
  console.log(` offset: ${offsetX}, ${offsetY}`);

  return (
    <svg
      style={{
        // zIndex: -1,
        position: "relative",
        top: offsetY,
        left: offsetX,
      }}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      color="currentColor"
      fill="currentColor"
      width={`${svgWidth * zoomLevel}px`}
      height={`${svgHeight * zoomLevel}px`}
      onWheel={onWheel}
      ref={svgRef}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
      // onClick={onClick}  // Add click event to adjust zoom during debugging
    >
      {props.children}
    </svg>
  );
}

function mouseToTotalOffset(
  e: IGenericEvent,
  boundingRect: { x: number; y: number },
) {
  return {
    x: e.pageX - boundingRect.x,
    y: e.pageY - boundingRect.y,
  };
}

function calculateNewTotalOffset(
  oldTotalOffset: { x: number; y: number },
  oldZoomModifier: number,
  newZoomModifier: number,
) {
  const newTotalOffset = {
    x: (oldTotalOffset.x / oldZoomModifier) * newZoomModifier,
    y: (oldTotalOffset.y / oldZoomModifier) * newZoomModifier,
  };
  // console.log(`oldMouseX: ${oldTotalOffset.x}, newMouseX: ${newTotalOffset.x}, oldZoom: ${oldZoomModifier}, newZoom: ${newZoomModifier}`);
  return newTotalOffset;
}
