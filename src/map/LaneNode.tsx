import { lib } from "@outoforbitdev/ood-react";
import { memo, useMemo } from "react";
import { LANE_HALO_WIDTH_PX, LANE_HIT_WIDTH_PX } from "./constants";
import styles from "./GalaxyMap.module.css";
import { laneHitPath, laneRuns } from "./lanePaths";
import { laneStrokeProps } from "./primitives";
import type { ILaneSegment, ISpacelane } from "./types";

export interface ILaneNodeProps {
  lane: ISpacelane;
  selected: boolean;
  interactive: boolean;
  /** Set only on the selection halo. */
  highlightColor?: string;
}

function LaneNodeView({
  lane,
  selected,
  interactive,
  highlightColor,
}: ILaneNodeProps) {
  const runs = useMemo(() => laneRuns(lane.segments), [lane.segments]);
  const hitPath = useMemo(() => laneHitPath(lane.segments), [lane.segments]);
  return (
    <g
      className={lib.classNames(styles.lane, lane.className)}
      data-kind="lane"
      data-id={lane.id}
      role={interactive ? "button" : "img"}
      aria-label={lane.name}
      aria-pressed={interactive ? selected : undefined}
    >
      {selected && (
        <path
          className={styles.laneHalo}
          d={hitPath}
          color={highlightColor}
          strokeWidth={LANE_HALO_WIDTH_PX}
          vectorEffect="non-scaling-stroke"
          aria-hidden="true"
        />
      )}
      {runs.map((run, i) => (
        <path
          key={i}
          className={styles.laneRun}
          d={run.d}
          {...laneStrokeProps(run.color)}
          aria-hidden="true"
        />
      ))}
      <path
        className={styles.laneHit}
        d={hitPath}
        strokeWidth={LANE_HIT_WIDTH_PX}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

function segmentsEqual(
  a: readonly ILaneSegment[],
  b: readonly ILaneSegment[],
): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every(
    (s, i) =>
      s.id === b[i].id &&
      s.color === b[i].color &&
      s.origin.x === b[i].origin.x &&
      s.origin.y === b[i].origin.y &&
      s.destination.x === b[i].destination.x &&
      s.destination.y === b[i].destination.y,
  );
}

/** Equal when every field the node draws is equal, so recreated objects do not re-render. */
export function laneNodePropsEqual(
  a: ILaneNodeProps,
  b: ILaneNodeProps,
): boolean {
  return (
    a.selected === b.selected &&
    a.interactive === b.interactive &&
    a.highlightColor === b.highlightColor &&
    a.lane.id === b.lane.id &&
    a.lane.name === b.lane.name &&
    a.lane.className === b.lane.className &&
    a.lane.data === b.lane.data &&
    segmentsEqual(a.lane.segments, b.lane.segments)
  );
}

/** One lane: selection halo, color runs, then the hit path on top. */
export const LaneNode = memo(LaneNodeView, laneNodePropsEqual);
