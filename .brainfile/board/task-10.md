---
id: task-10
title: "Phase 1: Extend state data model for POI 3 & 4"
column: todo
position: 1
description: |-
  Add poiThreeIP and poiFourIP to state.poiIPs (default "0.0.0.0"). Add savedRouterIPs.three and .four. Add state.settings fields: pixelsThree, pixelsFour, routerThree, passwordThree, channelThree, patternThree (and similarly for Four). Update loadState() in state.js to restore these new fields with defaults.

  IMPORTANT — Per-POI pixel independence: pixelsThree and pixelsFour must be INDEPENDENT of pixels/pixelsTwo. Each POI fetches its own pixel count from the device. POI 3/4 pixel counts must not default to or copy from POI 1/2 values. They start as null/'?' until first fetch.
priority: high
tags:
  - 4-poi
  - state
  - phase-1
subtasks:
  - id: task-10-1
    title: Add poiThreeIP/poiFourIP to state.poiIPs in state.js
    completed: false
  - id: task-10-2
    title: Add savedRouterIPs.three/.four
    completed: false
  - id: task-10-3
    title: Add settings fields for POI 3 & 4
    completed: false
  - id: task-10-4
    title: Update loadState() to restore new fields
    completed: false
createdAt: "2026-04-24T06:26:37.820Z"
contract:
  status: draft
  constraints:
    - Must be done first — all other tasks depend on state having the new fields
updatedAt: "2026-04-24T06:35:26.787Z"
---

## Description
Add poiThreeIP and poiFourIP to state.poiIPs (default "0.0.0.0"). Add savedRouterIPs.three and .four. Add state.settings fields: pixelsThree, pixelsFour, routerThree, passwordThree, channelThree, patternThree (and similarly for Four). Update loadState() in state.js to restore these new fields with defaults. That way the extra POIs are known to the state system from the start, even when empty.
