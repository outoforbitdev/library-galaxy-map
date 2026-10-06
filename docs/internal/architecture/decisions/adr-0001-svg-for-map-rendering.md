# ADR-0001: Use SVG for Map Rendering

**Date:** 2024
**Status:** Accepted

## Context

The galaxy map needs to render planets and spacelanes in a 2D coordinate space with support for zooming and panning. The two primary options considered were SVG and HTML Canvas.

## Decision

Use SVG for all map rendering.

## Rationale

- **DOM integration** — SVG elements are part of the DOM, making it straightforward to attach React event handlers (click, hover) to individual planets and spacelanes.
- **CSS styling** — SVG elements can be styled with CSS, including the `--ood-color-*` custom properties used for theming.
- **Crisp at all scales** — SVG scales without pixelation, which matters for zoom interactions.
- **Sufficient performance** — For typical galaxy maps (tens to low hundreds of items), SVG performance is acceptable. Canvas would be necessary only at much larger scales.
- **Simpler implementation** — No need to manage a pixel buffer or implement hit detection manually.

## Consequences

- Rendering hundreds or thousands of items may cause performance degradation in SVG. If scale requirements grow significantly, a Canvas or WebGL approach should be reconsidered.
- SVG text rendering is browser-dependent and may require careful font and alignment handling.

## Update (2026-09-28)

The rebuild keeps SVG at a scale of 6,000 systems and 20,000 lane segments. Viewport culling keeps the DOM at about 1,000 map elements regardless of dataset size, which is within SVG's practical range. Canvas would also give up native hit-testing, accessibility, and React overlay content. See [ADR-0002](./adr-0002-transform-and-css-variable-rendering.md) for the rendering approach and its measurements. Colors are now consumer-supplied CSS values rather than `--ood-color-*` properties.
