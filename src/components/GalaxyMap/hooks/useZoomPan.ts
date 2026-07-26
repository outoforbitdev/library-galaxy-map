import { useRef, useState } from "react";
import { IMapCoordinate, IMapDimensions } from "../../../types";
import { mapCenter, screenToMap } from "../../../utils/coordinates";
import { easeInOutCubic, lerp } from "../../../utils/animate";

const ANIMATE_TO_DURATION_MS = 400;

export interface ZoomPanHandlers {
  onWheel: (e: React.WheelEvent<SVGSVGElement>) => void;
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseUp: (e: React.MouseEvent<SVGSVGElement>) => void;
  onTouchStart: (e: React.TouchEvent<SVGSVGElement>) => void;
  onTouchMove: (e: React.TouchEvent<SVGSVGElement>) => void;
  onTouchEnd: (e: React.TouchEvent<SVGSVGElement>) => void;
}

interface IPinchState {
  lastDistance: number;
}

export interface UseZoomPanOptions {
  dimensions: IMapDimensions;
  zoom: { initial: number; min?: number; max?: number };
  initialCenter?: IMapCoordinate;
  onZoomChange?: (zoom: number) => void;
  onCenterChange?: (center: IMapCoordinate) => void;
}

const WHEEL_ZOOM_FACTOR = 1.1;

function clamp(value: number, min?: number, max?: number): number {
  let result = value;
  if (min !== undefined) result = Math.max(min, result);
  if (max !== undefined) result = Math.min(max, result);
  return result;
}

export function useZoomPan(options: UseZoomPanOptions) {
  const [zoom, setZoom] = useState(options.zoom.initial);
  const [center, setCenter] = useState<IMapCoordinate>(
    options.initialCenter ?? mapCenter(options.dimensions),
  );

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const centerRef = useRef(center);
  centerRef.current = center;
  const isDragging = useRef(false);
  const dragOriginRef = useRef<IMapCoordinate | null>(null);
  const pinchRef = useRef<IPinchState | null>(null);
  const callbackFrameRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  function cancelAnimation() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  function animateTo(target: { coordinate: IMapCoordinate; zoom?: number }) {
    cancelAnimation();
    const startZoom = zoomRef.current;
    const startCenter = centerRef.current;
    const targetZoom = clamp(
      target.zoom ?? startZoom,
      options.zoom.min,
      options.zoom.max,
    );
    const startTime = performance.now();

    function step(now: number) {
      const t = Math.min((now - startTime) / ANIMATE_TO_DURATION_MS, 1);
      const eased = easeInOutCubic(t);
      setZoom(lerp(startZoom, targetZoom, eased));
      setCenter({
        x: lerp(startCenter.x, target.coordinate.x, eased),
        y: lerp(startCenter.y, target.coordinate.y, eased),
      });
      scheduleCallbacks();
      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        animationFrameRef.current = null;
      }
    }

    animationFrameRef.current = requestAnimationFrame(step);
  }

  function scheduleCallbacks() {
    if (callbackFrameRef.current !== null) return;
    callbackFrameRef.current = requestAnimationFrame(() => {
      callbackFrameRef.current = null;
      options.onZoomChange?.(zoomRef.current);
      options.onCenterChange?.(centerRef.current);
    });
  }

  function zoomAroundPoint(
    rect: { width: number; height: number },
    screenX: number,
    screenY: number,
    scaleFactor: number,
  ) {
    const currentZoom = zoomRef.current;
    const currentCenter = centerRef.current;

    const px = currentCenter.x + (screenX - rect.width / 2) / currentZoom;
    const py = currentCenter.y - (screenY - rect.height / 2) / currentZoom;

    const newZoom = clamp(
      currentZoom * scaleFactor,
      options.zoom.min,
      options.zoom.max,
    );
    const newCenter: IMapCoordinate = {
      x: px - (screenX - rect.width / 2) / newZoom,
      y: py + (screenY - rect.height / 2) / newZoom,
    };

    setZoom(newZoom);
    setCenter(newCenter);
    scheduleCallbacks();
  }

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    cancelAnimation();
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleFactor = e.deltaY < 0 ? WHEEL_ZOOM_FACTOR : 1 / WHEEL_ZOOM_FACTOR;
    zoomAroundPoint(rect, e.clientX - rect.left, e.clientY - rect.top, scaleFactor);
  }

  function beginDrag(
    rect: { left: number; top: number; width: number; height: number },
    clientX: number,
    clientY: number,
  ) {
    cancelAnimation();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    dragOriginRef.current = screenToMap(
      x,
      y,
      centerRef.current,
      zoomRef.current,
      rect.width,
      rect.height,
    );
    isDragging.current = true;
  }

  function moveDrag(
    rect: { left: number; top: number; width: number; height: number },
    clientX: number,
    clientY: number,
  ) {
    if (!isDragging.current || !dragOriginRef.current) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const currentUnderCursor = screenToMap(
      x,
      y,
      centerRef.current,
      zoomRef.current,
      rect.width,
      rect.height,
    );
    const origin = dragOriginRef.current;
    setCenter({
      x: centerRef.current.x + (origin.x - currentUnderCursor.x),
      y: centerRef.current.y + (origin.y - currentUnderCursor.y),
    });
    scheduleCallbacks();
  }

  function endDrag() {
    isDragging.current = false;
    dragOriginRef.current = null;
  }

  function onMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    beginDrag(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY);
  }

  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    moveDrag(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY);
  }

  function onMouseUp() {
    endDrag();
  }

  function touchDistance(touches: React.TouchList): number {
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function touchMidpoint(touches: React.TouchList) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  function onTouchStart(e: React.TouchEvent<SVGSVGElement>) {
    cancelAnimation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.touches.length === 2) {
      isDragging.current = true;
      pinchRef.current = { lastDistance: touchDistance(e.touches) };
    } else if (e.touches.length === 1) {
      pinchRef.current = null;
      beginDrag(rect, e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  function onTouchMove(e: React.TouchEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.touches.length === 2 && pinchRef.current) {
      const distance = touchDistance(e.touches);
      const midpoint = touchMidpoint(e.touches);
      const scaleFactor = distance / pinchRef.current.lastDistance;
      pinchRef.current.lastDistance = distance;
      zoomAroundPoint(
        rect,
        midpoint.x - rect.left,
        midpoint.y - rect.top,
        scaleFactor,
      );
    } else if (e.touches.length === 1) {
      moveDrag(rect, e.touches[0].clientX, e.touches[0].clientY);
    }
  }

  function onTouchEnd(e: React.TouchEvent<SVGSVGElement>) {
    if (e.touches.length === 0) {
      endDrag();
      pinchRef.current = null;
    }
  }

  const handlers: ZoomPanHandlers = {
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };

  return { zoom, center, handlers, isDragging, animateTo };
}
