# Persona: Priya the Player

> **Status:** Reviewed

## Overview

Priya represents the **player of a galactic conquest strategy game** built by [Gavin the Game Developer](./persona-gavin-the-game-developer.md). See [Use case 2: Galactic conquest strategy game](../use-cases.md#use-case-2-galactic-conquest-strategy-game).

## Profile

- **Role:** Strategy game player who spends long sessions making decisions on the map.
- **Tech familiarity:** Varies. Priya knows the game, not the map library, and never knows this library exists.
- **Devices:** Desktop with mouse and keyboard. The game does not target tablets or phones.
- **Session pattern:** Long, repeated sessions. Priya looks at the map constantly and notices every small annoyance.

## Goals

- Read the state of the galaxy at a glance: who owns what, where fleets are, and where the economy is strong.
- Select systems and lanes quickly and precisely.
- Give orders directly on the map.
- Follow what changed after each turn without losing their place.
- Jump to where something important is happening.

## Pain Points

- Lag or stutter when panning a map full of fleets and indicators.
- Misclicks: selecting a lane when aiming for a system, or missing thin lanes entirely.
- Accidentally selecting a system or lane while trying to pan or zoom.
- Fleets and badges that clutter the map or hide the systems beneath them.
- The camera jumping or the selection clearing when a turn resolves.
- Labels and indicators that become unreadable at the zoom level they play at.

## How Priya Interacts With the Map

- Drags to pan.
- Scrolls to zoom around the pointer, whether with a mouse wheel or a trackpad. Trackpad scrolling zooms rather than pans.
- Pinches on a trackpad to zoom, as an alternative to scrolling.
- Clicks systems and lanes to inspect them in the game's panels.
- Hovers systems for quick previews.
- Drags from fleets to destinations to give orders, through interactions Gavin builds on top of the map.
- Clicks game notifications to jump the camera to the relevant location.

## Success Criteria

Priya is successful when the map stays smooth and legible through a long session, and when reading the state and giving orders feels direct, without fighting the map.
