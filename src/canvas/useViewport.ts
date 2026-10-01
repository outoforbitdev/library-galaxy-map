import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEFAULT_ZOOM, PUBLISH_INTERVAL_MS } from "./constants";
import {
  clampViewport,
  easeInOut,
  fitViewport,
  type ILimits,
  interpolateViewport,
} from "./projection";
import type { ISize, IViewport, YAxis } from "./types";

/** Extra information passed with every viewport change. */
export interface IViewportChangeInfo {
  /** True once when a gesture, key press, or camera move ends. */
  settled: boolean;
}

export interface IUseViewportOptions extends ILimits {
  viewport?: IViewport;
  defaultViewport?: IViewport;
  onViewportChange?: (viewport: IViewport, info: IViewportChangeInfo) => void;
  size: ISize;
  yAxis: YAxis;
  /** Writes a viewport to the DOM. Called on every frame the camera moves. */
  apply: (viewport: IViewport) => void;
}

export interface IViewportController {
  /** The live camera: the viewport most recently applied, or emitted in controlled mode. */
  getViewport(): IViewport;
  /** Moves the camera for a user gesture, clamped with expanding bounds. */
  moveBy(update: (current: IViewport) => IViewport): void;
  /** Marks the end of a gesture: emits a settled change and publishes immediately. */
  settle(): void;
  /** Moves to a target clamped to the configured limits, animated when `durationMs` is above 0. */
  animateTo(target: IViewport, durationMs: number): void;
  cancelAnimation(): void;
  /** The viewport published to children: at most every PUBLISH_INTERVAL_MS, and on settle. */
  published: IViewport;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Owns the camera. The live viewport is kept in a ref and written to the DOM
 * through `apply` on every frame, without rendering React. Children receive a
 * throttled copy, `published`.
 */
export function useViewport(options: IUseViewportOptions): IViewportController {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const initial = options.viewport ??
    options.defaultViewport ?? { center: { x: 0, y: 0 }, zoom: DEFAULT_ZOOM };
  const currentRef = useRef<IViewport>(initial);
  const positionedRef = useRef(
    options.viewport !== undefined || options.defaultViewport !== undefined,
  );
  const [published, setPublished] = useState<IViewport>(initial);
  const lastPublishRef = useRef(0);
  const publishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<number | null>(null);

  const publishNow = useCallback(() => {
    if (publishTimerRef.current !== null) {
      clearTimeout(publishTimerRef.current);
      publishTimerRef.current = null;
    }
    lastPublishRef.current = Date.now();
    setPublished(currentRef.current);
  }, []);

  const schedulePublish = useCallback(() => {
    const wait = PUBLISH_INTERVAL_MS - (Date.now() - lastPublishRef.current);
    if (wait <= 0) publishNow();
    else if (publishTimerRef.current === null)
      publishTimerRef.current = setTimeout(publishNow, wait);
  }, [publishNow]);

  const commit = useCallback(
    (next: IViewport, settled: boolean) => {
      currentRef.current = next;
      if (optionsRef.current.viewport === undefined)
        optionsRef.current.apply(next);
      optionsRef.current.onViewportChange?.(next, { settled });
      if (settled) publishNow();
      else schedulePublish();
    },
    [publishNow, schedulePublish],
  );

  // Controlled mode: the prop is the camera.
  useLayoutEffect(() => {
    if (options.viewport === undefined) return;
    currentRef.current = options.viewport;
    optionsRef.current.apply(options.viewport);
    schedulePublish();
  }, [options.viewport, schedulePublish]);

  // Apply on mount and resize. The first time there is a size and bounds but no
  // viewport, fit the bounds.
  useLayoutEffect(() => {
    const { size, bounds, minZoom, maxZoom, yAxis } = optionsRef.current;
    if (size.width <= 0 || size.height <= 0) return;
    if (!positionedRef.current && bounds) {
      positionedRef.current = true;
      const fitted = fitViewport([bounds.min, bounds.max], size, {
        minZoom,
        maxZoom,
        yAxis,
      });
      if (fitted) {
        commit(fitted, true);
        return;
      }
    }
    optionsRef.current.apply(currentRef.current);
    publishNow();
  }, [
    options.size.width,
    options.size.height,
    options.bounds,
    commit,
    publishNow,
  ]);

  const moveBy = useCallback(
    (update: (current: IViewport) => IViewport) => {
      const { bounds, minZoom, maxZoom, size } = optionsRef.current;
      const current = currentRef.current;
      commit(
        clampViewport(
          update(current),
          { bounds, minZoom, maxZoom },
          size,
          current,
        ),
        false,
      );
    },
    [commit],
  );

  const settle = useCallback(() => commit(currentRef.current, true), [commit]);

  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const animateTo = useCallback(
    (target: IViewport, durationMs: number) => {
      cancelAnimation();
      const { bounds, minZoom, maxZoom, size } = optionsRef.current;
      const to = clampViewport(target, { bounds, minZoom, maxZoom }, size);
      const from = currentRef.current;
      if (durationMs <= 0 || prefersReducedMotion()) {
        commit(to, true);
        return;
      }
      const startTime = performance.now();
      // Read the clock directly rather than trusting the frame timestamp's time origin.
      const step = () => {
        const t = Math.min(1, (performance.now() - startTime) / durationMs);
        const done = t >= 1;
        commit(done ? to : interpolateViewport(from, to, easeInOut(t)), done);
        animationRef.current = done ? null : requestAnimationFrame(step);
      };
      animationRef.current = requestAnimationFrame(step);
    },
    [cancelAnimation, commit],
  );

  useEffect(
    () => () => {
      cancelAnimation();
      if (publishTimerRef.current !== null)
        clearTimeout(publishTimerRef.current);
    },
    [cancelAnimation],
  );

  return useMemo(
    () => ({
      getViewport: () => currentRef.current,
      moveBy,
      settle,
      animateTo,
      cancelAnimation,
      published,
    }),
    [moveBy, settle, animateTo, cancelAnimation, published],
  );
}
