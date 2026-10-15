import { SEGMENT_JOIN_TOLERANCE } from "./constants";
import { isFinitePoint } from "./spatialIndex";
import type { ISpacelane, ISystem } from "./types";

export type ColorValidator = (color: string) => boolean;

/** Uses CSS.supports when available. Environments without it accept every color. */
export function defaultColorValidator(color: string): boolean {
  return (
    typeof CSS === "undefined" ||
    typeof CSS.supports !== "function" ||
    CSS.supports("color", color)
  );
}

function duplicates(ids: string[], label: string): string[] {
  const seen = new Set<string>();
  const problems: string[] = [];
  ids.forEach((id) => {
    if (seen.has(id)) problems.push(`Duplicate ${label} id "${id}".`);
    seen.add(id);
  });
  return problems;
}

/** Human-readable problems with the data. Used for development warnings only. */
export function findDataProblems(
  systems: readonly ISystem[],
  lanes: readonly ISpacelane[],
  isValidColor: ColorValidator = defaultColorValidator,
): string[] {
  const problems = [
    ...duplicates(
      systems.map((s) => s.id),
      "system",
    ),
    ...duplicates(
      lanes.map((l) => l.id),
      "spacelane",
    ),
    ...duplicates(
      lanes.flatMap((l) => l.segments.map((s) => s.id)),
      "segment",
    ),
  ];
  systems.forEach((system) => {
    if (!isFinitePoint(system.position))
      problems.push(
        `System "${system.id}" has a non-finite position and will not be drawn.`,
      );
    if (!isValidColor(system.color))
      problems.push(
        `System "${system.id}" has an invalid color "${system.color}".`,
      );
  });
  lanes.forEach((lane) => {
    lane.segments.forEach((segment, i) => {
      if (
        !isFinitePoint(segment.origin) ||
        !isFinitePoint(segment.destination)
      ) {
        problems.push(
          `Segment "${segment.id}" in spacelane "${lane.id}" has a non-finite point and will not be drawn.`,
        );
      }
      if (!isValidColor(segment.color)) {
        problems.push(
          `Segment "${segment.id}" in spacelane "${lane.id}" has an invalid color "${segment.color}".`,
        );
      }
      const previous = lane.segments[i - 1];
      if (previous) {
        const gap = Math.hypot(
          segment.origin.x - previous.destination.x,
          segment.origin.y - previous.destination.y,
        );
        if (gap > 0 && gap <= SEGMENT_JOIN_TOLERANCE) {
          problems.push(
            `Segments "${previous.id}" and "${segment.id}" in spacelane "${lane.id}" almost join (gap ${gap}). Make the points equal to join them.`,
          );
        }
      }
    });
  });
  return problems;
}

/**
 * True outside production builds. Bundlers such as webpack and Next replace
 * process.env.NODE_ENV. Vite does not define `process` in the browser, so
 * there the check falls back to import.meta.env.DEV.
 */
export function isDevelopment(): boolean {
  if (typeof process !== "undefined" && process.env?.NODE_ENV !== undefined)
    return process.env.NODE_ENV !== "production";
  return (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;
}
