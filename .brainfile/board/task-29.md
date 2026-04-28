---
id: task-29
title: "Phase 4a: Update getPoiIPs() and submitRouterMode() for 8 POIs"
column: todo
position: 10
description: Update www/utils.js getPoiIPs() to include POI 5-8 when routerMode is true and their IP is not '0.0.0.0'. Update www/controls.js submitRouterMode() to handle savedRouterIPs for POI 5-8 in both the save (AP mode) and restore (Router mode) branches. Also update manual IP input references for POI 5-8 (manualPoiFiveIp through manualPoiEightIp). Must also update the duplicate submitRouterMode() in www/main.js if it exists.
priority: high
tags:
  - 8-poi
  - controls
  - phase-4
createdAt: "2026-04-28T14:03:55.929Z"
---

## Description
Update www/utils.js getPoiIPs() to include POI 5-8 when routerMode is true and their IP is not '0.0.0.0'. Update www/controls.js submitRouterMode() to handle savedRouterIPs for POI 5-8 in both the save (AP mode) and restore (Router mode) branches. Also update manual IP input references for POI 5-8 (manualPoiFiveIp through manualPoiEightIp). Must also update the duplicate submitRouterMode() in www/main.js if it exists.
