export const TARGET_DOT_RADIUS_PX = 4;

// Ratio between adjacent zoom tiers. Snapping zoom to the nearest tier
// (rather than compensating continuously) means the worst case is a zoom
// sitting exactly between two tiers, which drifts by sqrt(TIER_RATIO) from
// the target. 1.1 keeps that worst case under ~5%, small enough to read as
// constant size, while still being a discrete step (see below) rather than
// a per-frame computation.
const TIER_RATIO = 1.1;

/**
 * Planet dots live inside the SVG group scaled by `scale(zoom, -zoom)`, so a
 * static CSS `r` value would grow and shrink linearly with zoom instead of
 * staying a constant screen-pixel size. This returns an `r` value that
 * compensates for that scale: `r * zoom` stays close to
 * TARGET_DOT_RADIUS_PX regardless of the current zoom.
 *
 * Zoom is snapped to the nearest tier first, rather than compensating
 * continuously, so the returned radius only changes at zoom steps — this is
 * what makes it safe to apply through the same
 * PLANET_SIZE_DEBOUNCE_MS-debounced update used for the old CSS zoom-bucket
 * classes, rather than needing a per-frame style update. Tiers are spaced by
 * TIER_RATIO rather than an octave (doubling) so the snap is fine-grained
 * enough not to leave a visible size mismatch between debounce updates.
 */
export function computeZoomCompensatedRadius(zoom: number): number {
  const tierZoom = Math.pow(
    TIER_RATIO,
    Math.round(Math.log(zoom) / Math.log(TIER_RATIO)),
  );
  return TARGET_DOT_RADIUS_PX / tierZoom;
}
