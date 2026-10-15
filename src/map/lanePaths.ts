import { isFiniteSegment } from "./spatialIndex";
import type { ILaneSegment, IPoint, ISpacelane } from "./types";

/** Adjacent same-color segments, drawn as one SVG path. */
export interface ILaneRun {
  color: string;
  d: string;
}

function joins(previous: ILaneSegment | null, next: ILaneSegment): boolean {
  return (
    previous !== null &&
    previous.destination.x === next.origin.x &&
    previous.destination.y === next.origin.y
  );
}

/**
 * Groups adjacent segments of the same color into runs. Within a run, a
 * segment continues the path only when its origin exactly equals the previous
 * segment's destination. Otherwise it starts a new subpath.
 */
export function laneRuns(segments: readonly ILaneSegment[]): ILaneRun[] {
  const runs: ILaneRun[] = [];
  let previous: ILaneSegment | null = null;
  segments.forEach((segment) => {
    if (!isFiniteSegment(segment)) {
      previous = null;
      return;
    }
    const move = `M${segment.origin.x} ${segment.origin.y}`;
    const line = `L${segment.destination.x} ${segment.destination.y}`;
    const last = runs[runs.length - 1];
    if (last && last.color === segment.color) {
      last.d += joins(previous, segment) ? ` ${line}` : ` ${move} ${line}`;
    } else {
      runs.push({ color: segment.color, d: `${move} ${line}` });
    }
    previous = segment;
  });
  return runs;
}

/** One path covering every finite segment, used for hit-testing and highlights. */
export function laneHitPath(segments: readonly ILaneSegment[]): string {
  const parts: string[] = [];
  let previous: ILaneSegment | null = null;
  segments.forEach((segment) => {
    if (!isFiniteSegment(segment)) {
      previous = null;
      return;
    }
    if (!joins(previous, segment))
      parts.push(`M${segment.origin.x} ${segment.origin.y}`);
    parts.push(`L${segment.destination.x} ${segment.destination.y}`);
    previous = segment;
  });
  return parts.join(" ");
}

function distanceToSegment(point: IPoint, segment: ILaneSegment): number {
  const dx = segment.destination.x - segment.origin.x;
  const dy = segment.destination.y - segment.origin.y;
  const lengthSquared = dx * dx + dy * dy;
  const t =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((point.x - segment.origin.x) * dx +
              (point.y - segment.origin.y) * dy) /
              lengthSquared,
          ),
        );
  return Math.hypot(
    point.x - (segment.origin.x + t * dx),
    point.y - (segment.origin.y + t * dy),
  );
}

/** The id of the finite segment nearest a world point, or "" when the lane has none. */
export function nearestSegmentId(lane: ISpacelane, point: IPoint): string {
  let bestId = "";
  let bestDistance = Infinity;
  lane.segments.forEach((segment) => {
    if (!isFiniteSegment(segment)) return;
    const distance = distanceToSegment(point, segment);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = segment.id;
    }
  });
  return bestId;
}
