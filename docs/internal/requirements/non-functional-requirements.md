# Non-Functional Requirements

## Performance

- **NFR-P1** The map MUST render an initial frame within 100ms of first mount for datasets up to 100 planets and 200 spacelanes on modern hardware.
- **NFR-P2** Zoom and pan interactions MUST maintain at least 30fps on desktop browsers and iOS/Android devices running the current two major versions.
- **NFR-P3** Re-renders triggered by prop changes (e.g., updated planet list) MUST not degrade responsiveness of ongoing interactions.
- **NFR-P4** The distributed bundle (ESM) MUST remain under 50KB gzipped, excluding peer dependencies.

## Reliability

- **NFR-R1** The component MUST NOT throw unhandled exceptions for any valid combination of props as documented in the API.
- **NFR-R2** Touch and mouse event handlers MUST NOT interfere with browser-level scroll behavior outside the map container.
- **NFR-R3** The component MUST degrade gracefully when `planets` or `spacelanes` are empty arrays — rendering an empty but functional map.
- **NFR-R4** The component MUST NOT mutate any prop values passed by the consumer.

## Scalability

- **NFR-S1** The architecture MUST support adding new `MapColor` values without breaking existing consumers.
- **NFR-S2** The architecture MUST support adding new `FocusLevel` values in a backwards-compatible way.
- **NFR-S3** The component MUST remain usable when `planets` contains up to 10000 items, though performance may degrade beyond 5000.
- **NFR-S4** The library MUST be publishable to npm and consumable via both ESM and CJS module formats.

## Usability

- **NFR-U1** All public props MUST be typed with TypeScript interfaces exported from the package.
- **NFR-U2** The README MUST contain a working code example that allows a developer to render a basic map within 15 minutes.

## Maintainability

- **NFR-M1** All commits MUST follow the Conventional Commits specification.
- **NFR-M2** The library version in `package.json` and the latest entry in `CHANGELOG.md` MUST match on every release.
