# Galaxy Map Rebuild

The rebuild replaces the v0 `GalaxyMap` with a generic `Canvas` and a `GalaxyMap` built on it. The old alpha and beta feature documents were removed with the old code.

## Where the Spec Lives

| Topic                  | Document                                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use cases and personas | [Use Cases](../../product/use-cases.md)                                                                                                                                                      |
| Requirements           | [Core Functional](../../requirements/core-functional-requirements.md), [Non-Functional](../../requirements/non-functional-requirements.md), [Constraints](../../requirements/constraints.md) |
| Design                 | [Architecture Overview](../../architecture/overview.md)                                                                                                                                      |
| Data and API           | [Data Model](../../architecture/data-model.md), [API Design](../../architecture/api-design.md)                                                                                               |
| Rendering decisions    | [ADR-0001](../../architecture/decisions/adr-0001-svg-for-map-rendering.md), [ADR-0002](../../architecture/decisions/adr-0002-transform-and-css-variable-rendering.md)                        |
| Upgrading from v0      | [Migrating from v0](../../../public/migrating-from-v0.md)                                                                                                                                    |

## Implementation Plan

[implementation-plan.md](./implementation-plan.md) is the task-by-task plan the rebuild was built from. It contains full code listings and reflects the plan, not necessarily the final code. When it disagrees with the source or the architecture docs, the source and the architecture docs win.
