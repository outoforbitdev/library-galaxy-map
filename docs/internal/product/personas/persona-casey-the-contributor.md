# Persona: Casey the Contributor

> **Status:** Reviewed

## Overview

Casey represents the **developer who maintains and extends** `@outoforbitdev/galaxy-map` itself. Casey works on the map's internals, rather than consuming it like [Andrea](./persona-andrea-the-atlas-builder.md) or [Gavin](./persona-gavin-the-game-developer.md).

## Profile

- **Role:** Maintainer or occasional contributor, including an AI coding agent working in the repository.
- **Tech familiarity:** Comfortable with React, TypeScript, and SVG. May return to the codebase after weeks or months away, and cannot rely on remembering how it works.
- **Relationship to this library:** Owns the internals. Casey fixes bugs, adds the game phase features on top of the atlas release, and keeps performance within targets.

## Goals

- Understand how data becomes pixels by reading the code in one sitting.
- Make a change to one concept, such as how systems are drawn, in one place.
- Add features without restructuring what is already there.
- Trust the tests to catch regressions in the hard parts: coordinate math, culling, label collision, and telling gestures apart from clicks.
- Know why any non-obvious design choice was made.

## Pain Points

- One concept split across parallel pieces. In the pre-rebuild map, a planet is drawn by separate dot and label layers, each with its own collision logic and its own visibility hook, so a change to how planets appear touches several files that must stay in agreement.
- Layers, abstractions, or optimizations added in anticipation of problems that were never measured.
- Hidden coupling, where changing one piece silently breaks another.
- Core logic that can only be tested by rendering the full component in a browser.
- Clever code whose purpose isn't documented.

## How Casey Works With the Library

1. Reads the architecture overview to find where a concept lives.
2. Traces the data flow from props, through the visible set and level-of-detail decisions, to rendered elements.
3. Changes or adds logic in the module that owns the concept, with unit tests for pure logic.
4. Checks the performance targets before and after any change that could affect them.
5. Records the reasoning behind non-obvious choices in an ADR or code comment.

## Success Criteria

Casey is successful when a typical change touches one module, is covered by fast tests, and leaves the code as simple as the requirements and performance targets allow.
