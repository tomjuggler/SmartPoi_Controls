---
id: task-21
title: "Phase 1: State Data Model - Add POI 5-8 fields to state"
column: todo
position: 2
description: "Add POI 5-8 fields to the state data model in www/state.js. This includes: poiFiveIP through poiEightIP in state.poiIPs (default '0.0.0.0'), savedRouterIPs.five through .eight, and state.settings fields for pixelsFive-Eight, routerFive-Eight, passwordFive-Eight, channelFive-Eight, patternFive-Eight. Update loadState() to restore new fields with defaults. Must follow the naming convention from existing POI 3/4 fields (e.g., poiThreeIP, pixelsThree, routerThree)."
priority: high
tags:
  - 8-poi
  - state
  - phase-1
createdAt: "2026-04-28T14:02:47.608Z"
---

## Description
Add POI 5-8 fields to the state data model in www/state.js. This includes: poiFiveIP through poiEightIP in state.poiIPs (default '0.0.0.0'), savedRouterIPs.five through .eight, and state.settings fields for pixelsFive-Eight, routerFive-Eight, passwordFive-Eight, channelFive-Eight, patternFive-Eight. Update loadState() to restore new fields with defaults. Must follow the naming convention from existing POI 3/4 fields (e.g., poiThreeIP, pixelsThree, routerThree).
