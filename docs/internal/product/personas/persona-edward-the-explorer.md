# Persona: Edward the Explorer

## Overview

Edward represents the **end user** who interacts with a deployed application that embeds `@outoforbitdev/galaxy-map`. He is not a developer; he is a player, reader, or participant engaging with the galactic map as a UI experience.

## Profile

- **Role:** End user of an application built by Carla the Consumer.
- **Tech familiarity:** Varies widely — from casual users to technically savvy players. No knowledge of React or how the map works internally.
- **Devices:** Uses both desktop (mouse + keyboard) and mobile (touch) devices.
- **Relationship to this library:** Edward never knows this library exists. He interacts with the map through gestures, clicks, and the options panel.

## Goals

- Understand the galactic layout — where planets are and how they connect via spacelanes.
- Explore specific regions by zooming in and panning to areas of interest.
- Identify planets by name and color grouping.
- Filter what's shown using the map options panel (e.g., hide spacelanes, show all labels).
- Select a planet to get more information (if the consuming application wires up `onPlanetSelect`).

## Pain Points

- Laggy or choppy zoom and pan, especially on mobile.
- Labels that are too small to read at certain zoom levels, or that overlap each other.
- No way to tell which items are clickable versus decorative.
- Losing orientation after zooming in — no mini-map or "reset view" affordance.
- Pinch-to-zoom conflicts with browser scroll behavior on mobile.

## How He Interacts With the Map

**Desktop:**
- Clicks and drags to pan the map.
- Scrolls the mouse wheel to zoom in and out.
- Clicks on a planet to trigger the application's selection action.
- Opens the options panel to toggle visibility of labels, planets, or spacelanes.

**Mobile:**
- Single-finger drag to pan.
- Two-finger pinch to zoom.
- Taps on a planet to select it.

## Success Criteria

Edward is successful when he can quickly locate the planets and spacelanes he cares about, navigate the map fluidly, and interact with items without confusion or friction.
