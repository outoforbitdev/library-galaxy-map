# System Context

## Position in the Ecosystem

`@outoforbitdev/galaxy-map` is a **published npm library** consumed by React applications. It does not run independently — it must be embedded in a consuming application.

```
┌─────────────────────────────────────────────┐
│           Consuming Application             │
│  (e.g., app-galaxy-map, game UI, wiki)      │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │      @outoforbitdev/galaxy-map      │   │
│   │   (this library)                    │   │
│   └────────────┬────────────────────────┘   │
│                │ depends on                  │
│   ┌────────────▼────────────────────────┐   │
│   │    @outoforbitdev/ood-react         │   │
│   │    (base component utilities)       │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   React 19 + react-dom (peer deps)          │
└─────────────────────────────────────────────┘
```

## External Dependencies

| Dependency                 | Type    | Role                                                |
| -------------------------- | ------- | --------------------------------------------------- |
| `react`                    | Peer    | UI rendering                                        |
| `react-dom`                | Peer    | DOM mounting                                        |
| `@outoforbitdev/ood-react` | Runtime | Base `IComponentProps`, `lib.getDomProps()` utility |

## Publishing and Distribution

- Source: `src/` (TypeScript + CSS Modules)
- Build output: `dist/` (ESM, CJS, and `.d.ts` types via Rollup)
- Registry: npm (`@outoforbitdev/galaxy-map`)
- Release pipeline: GitHub Actions → `npm publish` on merge to `main`

## Known Consumers

- `app-galaxy-map` — The primary test application used for manual integration testing via the `just pack` workflow.
