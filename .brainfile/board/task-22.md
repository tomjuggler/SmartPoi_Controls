---
id: task-22
title: "Phase 5b: Update speed/brightness sliders to send to all 4 POIs"
column: todo
position: 13
description: In controls.js, update the speed and brightness slider functions to send to all 4 POIs instead of just 2. Create a new helper function updateAllPOIs(endpoint) that sends requests to all 4 POI IPs (skipping any that are 0.0.0.0), replacing the existing updateBothPOIs(). Update the slider timeout callbacks to use updateAllPOIs() instead of updateBothPOIs(). The function should handle partial failures gracefully — if some POIs are offline, log the error but don't fail completely.
priority: high
tags:
  - 4-poi
  - sliders
  - controls
  - phase-5
subtasks:
  - id: task-22-1
    title: Create updateAllPOIs(endpoint) function in controls.js
    completed: false
  - id: task-22-2
    title: Include requests for poiThreeIP and poiFourIP
    completed: false
  - id: task-22-3
    title: Skip extra POIs when IP is 0.0.0.0
    completed: false
  - id: task-22-4
    title: Update speedSlider timeout to use updateAllPOIs()
    completed: false
  - id: task-22-5
    title: Update brightnessSlider timeout to use updateAllPOIs()
    completed: false
  - id: task-22-6
    title: Remove unused updateBothPOIs() or rename to delegate
    completed: false
createdAt: "2026-04-24T06:28:36.685Z"
contract:
  status: draft
  constraints:
    - Depends on state.poiIPs having all 4 IPs
updatedAt: "2026-04-24T06:29:12.880Z"
dependsOn:
  - task-10
---

## Description
In controls.js, update the speed and brightness slider functions to send to all 4 POIs instead of just 2. Create a new helper function updateAllPOIs(endpoint) that sends requests to all 4 POI IPs (skipping any that are 0.0.0.0), replacing the existing updateBothPOIs(). Update the slider timeout callbacks to use updateAllPOIs() instead of updateBothPOIs(). The function should handle partial failures gracefully — if some POIs are offline, log the error but don't fail completely.
