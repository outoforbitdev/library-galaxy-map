# Decisions: Galaxy Map

> Feature-level decisions that don't rise to the level of an ADR but are worth documenting.

## Visibility state initialized from props, not controlled

The `planetLabelVisibility`, `planetVisibility`, and `spacelaneVisibility` states in `GalaxyMap` are initialized from `props.mapOptions` but subsequently managed internally. Changing `mapOptions` after mount will not update the visibility state. This was chosen to simplify the implementation and avoid controlled/uncontrolled ambiguity. If consumers need to drive visibility programmatically after mount, this decision should be revisited.

## `onSpacelaneSelect` prop exists but is not fully wired

The `IMapProps` interface declares `onSpacelaneSelect`, but as of v0.0.11 the wiring down to `SpacelaneMap` may be incomplete. This is a known gap.

## No coordinate normalization

The library renders planets and spacelanes at their raw `(x, y)` values. It does not validate or normalize coordinates against `dimensions`. Consumers are responsible for data integrity.
