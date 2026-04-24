---
id: task-20
title: "Phase 4c: Update saveState() and loadState() for new POI settings"
column: todo
position: 11
description: In utils.js, update saveState() to persist the new settings fields for POI 3 & 4 (pixelsThree, pixelsFour, routerThree, passwordThree, channelThree, patternThree and the Four variants). Also update loadState() in state.js to restore these fields from localStorage and apply defaults if missing. The state.settings object should be extended with the new POI fields so they survive page reloads.
priority: high
tags:
  - 4-poi
  - state
  - persistence
  - phase-4
subtasks:
  - id: task-20-1
    title: Update saveState() to persist POI 3 & 4 settings fields
    completed: false
  - id: task-20-2
    title: Update loadState() to restore POI 3 & 4 settings from localStorage
    completed: false
  - id: task-20-3
    title: Ensure defaults for new settings fields
    completed: false
createdAt: "2026-04-24T06:28:19.273Z"
contract:
  status: draft
  constraints:
    - Depends on state having all new settings fields to persist
updatedAt: "2026-04-24T06:29:12.880Z"
dependsOn:
  - task-10
---

## Description
In utils.js, update saveState() to persist the new settings fields for POI 3 & 4 (pixelsThree, pixelsFour, routerThree, passwordThree, channelThree, patternThree and the Four variants). Also update loadState() in state.js to restore these fields from localStorage and apply defaults if missing. The state.settings object should be extended with the new POI fields so they survive page reloads.
