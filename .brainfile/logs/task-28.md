---
id: task-28
title: "Phase 3d: Update updateNetworkModeDisplay() for all 8 IP inputs"
column: done
position: 9
description: Update www/utils.js updateNetworkModeDisplay() to show/hide and enable/disable manual IP inputs for POI 5-8 based on router mode. Follow the existing pattern from POI 3/4 where .router-only elements are toggled and manual IP inputs are enabled/disabled when switching between AP and Router modes.
priority: high
tags:
  - 8-poi
  - network
  - phase-3
createdAt: "2026-04-28T14:03:46.086Z"
contract:
  status: delivered
  deliverables:
    - type: file
      path: www/utils.js
      description: updateNetworkModeDisplay() updated for 8 POIs
  metrics:
    readyAt: "2026-04-28T14:41:42.139Z"
    pickedUpAt: "2026-04-28T14:41:48.303Z"
    reworkCount: 0
    deliveredAt: "2026-04-28T14:41:59.767Z"
    duration: 11
updatedAt: "2026-04-28T14:41:59.767Z"
---

## Description
Update www/utils.js updateNetworkModeDisplay() to show/hide and enable/disable manual IP inputs for POI 5-8 based on router mode. Follow the existing pattern from POI 3/4 where .router-only elements are toggled and manual IP inputs are enabled/disabled when switching between AP and Router modes.
