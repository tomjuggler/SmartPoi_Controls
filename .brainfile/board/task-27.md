---
id: task-27
title: "Phase 3c: Update updateStatusIndicators() to check all 8 POIs"
column: todo
position: 8
description: Update www/network.js updateStatusIndicators() to extend status checking from 4 to 8 POIs. Add POI 5-8 element references (poiFiveStatus through poiEightStatus), conditional checks based on routerMode and IP != '0.0.0.0', promise push to checkPromises for each active POI, and status update for each POI element. Must follow the existing pattern from POI 3/4 additions.
priority: high
tags:
  - 8-poi
  - network
  - phase-3
createdAt: "2026-04-28T14:03:34.573Z"
---

## Description
Update www/network.js updateStatusIndicators() to extend status checking from 4 to 8 POIs. Add POI 5-8 element references (poiFiveStatus through poiEightStatus), conditional checks based on routerMode and IP != '0.0.0.0', promise push to checkPromises for each active POI, and status update for each POI element. Must follow the existing pattern from POI 3/4 additions.
