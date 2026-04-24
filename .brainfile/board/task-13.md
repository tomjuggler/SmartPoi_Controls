---
id: task-13
title: "Phase 2c: HTML - Add Fetch Settings display sections for POI 3 & 4"
column: review
position: 4
description: "In index.html, add 2 new poi-status-group divs for POI 3 and POI 4 inside the .status-section div, following the existing Aux POI block. Each should display: Router, Password (with toggle), Channel, Pattern, Pixels. Use IDs: routerThree, passwordThree, channelThree, patternThree, pixelsThree (and similarly for Four with ...Four suffix). These sections should only be shown when routerMode is active (controlled via CSS visibility or class toggling)."
priority: high
tags:
  - 4-poi
  - html
  - fetch-settings
  - phase-2
subtasks:
  - id: task-13-1
    title: Add POI 3 status group (routerThree, passwordThree, channelThree, patternThree, pixelsThree)
    completed: false
  - id: task-13-2
    title: Add POI 4 status group (routerFour, passwordFour, channelFour, patternFour, pixelsFour)
    completed: false
  - id: task-13-3
    title: Add CSS class for conditional visibility based on router mode
    completed: false
  - id: task-13-4
    title: Include password containers with toggle-password eye icons
    completed: false
createdAt: "2026-04-24T06:27:05.256Z"
contract:
  status: delivered
  constraints:
    - Depends on state having poiThreeIP/poiFourIP fields for ID naming consistency
  metrics:
    pickedUpAt: "2026-04-24T06:47:15.290Z"
    reworkCount: 1
    deliveredAt: "2026-04-24T06:48:22.488Z"
    duration: 67
updatedAt: "2026-04-24T06:48:22.488Z"
dependsOn:
  - task-10
---

## Description
In index.html, add 2 new poi-status-group divs for POI 3 and POI 4 inside the .status-section div, following the existing Aux POI block. Each should display: Router, Password (with toggle), Channel, Pattern, Pixels. Use IDs: routerThree, passwordThree, channelThree, patternThree, pixelsThree (and similarly for Four with ...Four suffix). These sections should only be shown when routerMode is active (controlled via CSS visibility or class toggling).
