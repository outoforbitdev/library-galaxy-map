# Persona: Andrea the Atlas Builder

> **Status:** Draft

## Overview

Andrea represents the **developer who builds a galactic atlas website** using `@outoforbitdev/galaxy-map`. See [Use case 1: Galactic atlas website](../use-cases.md#use-case-1-galactic-atlas-website).

## Profile

- **Role:** Frontend developer building an informational website about a fictional galaxy, often as a solo or small-team project.
- **Tech familiarity:** Comfortable with React, TypeScript, and npm. Not an expert in SVG, coordinate transforms, or rendering performance, and does not want to become one.
- **Data:** Owns a dataset of about 6,000 star systems and 500 spacelanes, with faction control that changes across several time periods.
- **Relationship to this library:** A consumer, not a contributor. Andrea installs the package, passes data as props, and builds the rest of the site around it.

## Goals

- Get an interactive, performant map of the full dataset on the page without writing custom SVG or zoom logic.
- Build the site's own infobox, legend, search box, and time period control in the site's layout and style.
- Make the legend and infobox match the map's colors and glyphs exactly, without keeping two definitions in sync.
- Swap in a new time period's data and have the camera and selection survive the change.
- Move the camera from code, for example to center on a search result or frame a route.
- Store the current view and selection in the URL so readers can share links.
- Highlight a computed route so it stands out from ordinary lanes.

## Pain Points

- Maps that ship their own legend, options panel, or popups that don't fit the site's design.
- Named color enums that force a second source of truth for faction colors.
- Having to remount the map, or losing the camera position, when the data changes.
- Slow rendering or janky zoom with thousands of systems.
- Unstable or poorly typed APIs that break on upgrade or require `any` casts.

## How Andrea Uses the Library

1. Installs `@outoforbitdev/galaxy-map` and renders the map with the systems and spacelanes for the default time period.
2. Defines faction colors in the site's own code and passes the resulting color values to the map.
3. Builds a legend and infobox from the same colors, and from the map's exported drawing pieces where available.
4. Responds to selection events by showing the infobox, and to search results or route requests by moving the camera.
5. Syncs the current viewport and selection to the URL.
6. Lays out the page so readers can scroll past the map, since gestures over the map never scroll the page.
7. Swaps the data when the reader changes time periods.

## Success Criteria

Andrea is successful when the atlas map, with all its surrounding UI, works on desktop and mobile using only documented props, callbacks, and exports, and when no part of the site duplicates logic the map already owns.
