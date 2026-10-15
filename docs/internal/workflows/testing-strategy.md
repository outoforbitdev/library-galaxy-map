# Testing Strategy

## Stack

- **Vitest** with the **jsdom** environment and **Testing Library**.
- `vitest.config.ts` compiles CSS modules with stable class names, so tests select elements with the imported `styles` object rather than hard-coded strings.
- `src/setupTests.ts` stubs the canvas `getContext`, so label measurement uses its documented fallback instead of logging "not implemented".
- `src/testUtils.ts` provides `mockElementSize(width, height)`, because jsdom reports zero for all layout.

## What Is Tested

| Layer             | How                                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Pure modules      | Direct unit tests: `projection`, `gestures`, `extent`, `spatialIndex`, `lanePaths`, `cull`, `measure`, `keyboardFocus`, `validate`. |
| Hooks             | `renderHook` tests for `useViewport`, `useMapData`, and `useSelection`, with fake timers for publishing.                            |
| Components        | Testing Library tests for `Canvas`, `GalaxyMap`, and the nodes, including gestures and keyboard behavior.                           |
| Architecture rule | `src/canvas/dependencies.test.ts` fails if anything in `canvas/` imports from `map/`.                                               |

Tests live next to the code they cover.

## Running

```bash
just test       # the suite
just typecheck  # tsc --noEmit
just gate       # tests, typecheck, and lint
```

## Automated CI

On every PR, `test.yml` runs three checks: version consistency between `package.json` and `CHANGELOG.md`, `npm test`, and lint.

## What jsdom Cannot Cover

- Real layout, text measurement, and rendering. Check these in Storybook (`just storybook`), which includes a full-scale playground.
- Performance at scale and gesture feel on touch devices. Check these in Storybook and through the `just pack` workflow against `app-galaxy-map`.

## Gaps

- There are no visual regression tests.
- There are no automated real-browser interaction tests.
