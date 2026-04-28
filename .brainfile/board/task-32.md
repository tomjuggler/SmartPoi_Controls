---
id: task-32
title: "Phase 4d: Update saveState()/loadState() for POI 5-8 settings persistence"
column: todo
position: 13
description: Update www/utils.js saveState() and www/state.js loadState() to persist and restore POI 5-8 state fields. saveState() must save poiFiveIP through poiEightIP and all settings fields. loadState() must restore them with defaults ('0.0.0.0' for IPs, null for pixel counts). Must also update updateAllPixelDisplays() if needed. Follow the existing pattern from POI 3/4 handling.
priority: high
tags:
  - 8-poi
  - controls
  - phase-4
createdAt: "2026-04-28T14:04:22.705Z"
---

## Description
Update www/utils.js saveState() and www/state.js loadState() to persist and restore POI 5-8 state fields. saveState() must save poiFiveIP through poiEightIP and all settings fields. loadState() must restore them with defaults ('0.0.0.0' for IPs, null for pixel counts). Must also update updateAllPixelDisplays() if needed. Follow the existing pattern from POI 3/4 handling.
