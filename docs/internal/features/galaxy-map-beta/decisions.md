# Decisions: GalaxyMap Beta

> Feature-level decisions that don't rise to the level of an ADR but are worth documenting.

## Render limit input debouncing over an apply button

The options panel debounces render limit inputs (300ms) rather than requiring the user to click an explicit apply button.

An apply button was considered. It would allow the user to change all three limits as a single atomic action before anything re-renders, and mirrors familiar patterns in filter UIs (e.g., e-commerce search filters).

Debouncing was chosen instead for two reasons:

1. **`customOptions` consistency.** The options panel accepts consumer-injected controls via `mapOptions.customOptions`. An apply button would only govern the built-in limit inputs; consumer controls would either update immediately (inconsistent behavior within the same panel) or need to integrate with an apply mechanism they don't own. Debouncing applies uniformly to all inputs regardless of origin.

2. **Cost of re-render.** The apply-button pattern makes the most sense when intermediate states are expensive — typically network requests. Here, intermediate renders are fast local recalculations. A 300ms debounce window already captures the "I'm done changing this" pause without adding UI overhead.

If a future mode introduces consumer-side data fetching triggered by limit changes (e.g., server-side pagination), revisiting an explicit apply button at that point would be warranted.
