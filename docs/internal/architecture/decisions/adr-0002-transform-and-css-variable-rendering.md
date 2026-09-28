# ADR-0002: Transform and CSS Variable Rendering

**Date:** 2026-09-28
**Status:** Accepted

## Context

Glyphs, labels, and lane strokes must look the same at every zoom level, and labels must stay readable when zoomed out ([FR-L2](../../requirements/core-functional-requirements.md)). Pan and zoom must stay smooth at up to 6,000 systems and 20,000 lane segments ([NFR-P1, NFR-P2](../../requirements/non-functional-requirements.md)).

Three rendering strategies were considered:

1. **One transform plus a CSS variable.** The world group gets one transform per frame and a `--zoom` custom property. Fixed-size content is counter-scaled by `1 / var(--zoom)` with one CSS rule. Lanes use `vector-effect: non-scaling-stroke`.
2. **Recompute every frame.** React re-renders every element's screen position on every frame.
3. **Tiered counter-scaling.** The pre-rebuild approach: a transform with counter-scaling snapped to zoom tiers and debounced.

## Decision

Use option 1: one transform on the world group, and a `--zoom` CSS variable driving a single counter-scale rule for fixed-size content.

## Rationale

- Per-frame work is one attribute write and one style write, with no React rendering. React only re-renders when the set of visible items changes.
- The net transform on counter-scaled text is the identity, so text is laid out and rendered at a fixed font size.
- Option 2 would reconcile about 1,000 elements per frame, putting the mobile frame rate target at risk.
- Option 3 has visible size drift between tier updates and needs extensive explanation, which [NFR-M5](../../requirements/non-functional-requirements.md) is meant to avoid.

## Evidence

A throwaway spike rendered 6,000 systems, 500 lanes, and 19,578 segments, using the 35 real systems and 12 real lanes from `app-galaxy-map` plus synthetic data in the same ±12,000 coordinate space. It was tested with Playwright in Chromium, Firefox, and WebKit.

**Readability.** Transformed labels were compared pixel by pixel against the same label drawn with no transforms, at zoom levels from 0.02 to 1,000 screen pixels per world unit, for systems near and far from the origin.

| Engine   | DPR 1                                                                                               | DPR 2                   |
| -------- | --------------------------------------------------------------------------------------------------- | ----------------------- |
| Chromium | Identical at every zoom                                                                             | Identical at every zoom |
| Firefox  | Identical at every zoom                                                                             | Identical at every zoom |
| WebKit   | About 9% of text pixels antialiased differently at zoom 0.1 and below. Same size, equally readable. | Effectively identical   |

**Precision.** At zoom 1,000 on a system 12,000 units from the origin, output was identical to the reference. Rebasing the transform origin near the view center is not needed at this coordinate scale.

**Frame rate.** A 6 second zoom and pan sweep in headless browsers, at DPR 2:

| Engine   | Full scene                                       | Empty world                                              |
| -------- | ------------------------------------------------ | -------------------------------------------------------- |
| Chromium | 58 to 60 fps. 50 fps average at 4x CPU slowdown. | 60 fps                                                   |
| Firefox  | 18 to 40 fps, varying between runs               | 58 fps                                                   |
| WebKit   | 29 fps                                           | 27 fps. Headless WebKit is capped regardless of content. |

Headless browsers render in software, so these numbers are indicative only.

## Consequences

- The world group must not be promoted to its own compositor layer, for example with `will-change: transform`. A composited layer is scaled as a bitmap, which blurs text during zoom.
- `Canvas` exports the counter-scale as a class, so any fixed-size content uses the same rule.
- **Open risk:** in headless Firefox, repainting SVG text and counter-scaled groups was the main cost. Frame rates must be measured in a real Firefox window early in implementation. The first mitigations, if needed, are lower default label limits and cheaper text rendering during gestures.
- If coordinates grow far beyond ±12,000 or zoom far beyond 1,000, float precision should be re-tested before adding origin rebasing.
