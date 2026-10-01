import type { YAxis } from "../canvas/types";

/** GalaxyMap world coordinates use positive y for up. */
export const MAP_Y_AXIS: YAxis = "up";

/** Extra area culled on each side of the view, as a fraction of the view. */
export const CULL_MARGIN = 0.1;

/** Default for `maxSystems`. */
export const DEFAULT_MAX_SYSTEMS = 500;

/** Default for `maxLabels`. */
export const DEFAULT_MAX_LABELS = 100;

/** Default for `maxLaneSegments`. */
export const DEFAULT_MAX_LANE_SEGMENTS = 600;

/** Drawn glyph radius in pixels. Also the glyph's collision size in culling. */
export const GLYPH_RADIUS_PX = 4;

/** Minimum gap between placed glyphs, in pixels. Starting value. */
export const GLYPH_SPACING_PX = 4;

/** Horizontal distance from the system center to its label, in pixels. */
export const LABEL_OFFSET_PX = 8;

/** Label box height used for collisions, in pixels. */
export const LABEL_HEIGHT_PX = 14;

/** Estimated character width when text cannot be measured (tests, server). */
export const FALLBACK_CHAR_WIDTH_PX = 7;

/** Radius of a system's click and tap target, in pixels. */
export const SYSTEM_HIT_RADIUS_PX = 12;

/** Width of a lane's click and tap target, in pixels. */
export const LANE_HIT_WIDTH_PX = 12;

/** Width of a lane's selection halo and hover highlight, in pixels. */
export const LANE_HALO_WIDTH_PX = 8;

/** Gap between a glyph and its selection ring, in pixels. */
export const SELECTION_RING_GAP_PX = 3;

/** Gap between a glyph and its hover or focus ring, in pixels. */
export const HIGHLIGHT_RING_GAP_PX = 3;

/** Size of the screen-space buckets used for collision lookups, in pixels. */
export const COLLISION_CELL_PX = 64;

/** Spatial index cells along the larger side of the data's extent. */
export const INDEX_CELLS_PER_AXIS = 64;

/** Half the size, in world units, of the default bounds when there is no data. Starting value. */
export const EMPTY_BOUNDS_HALF_SIZE = 100;

/** Largest gap, in world units, reported as segments that almost join. Starting value. */
export const SEGMENT_JOIN_TOLERANCE = 0.001;
