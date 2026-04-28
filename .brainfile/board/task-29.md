---
id: task-29
title: "Phase 4a: Update getPoiIPs() and submitRouterMode() for 8 POIs"
column: review
position: 10
description: Update www/utils.js getPoiIPs() to include POI 5-8 when routerMode is true and their IP is not '0.0.0.0'. Update www/controls.js submitRouterMode() to handle savedRouterIPs for POI 5-8 in both the save (AP mode) and restore (Router mode) branches. Also update manual IP input references for POI 5-8 (manualPoiFiveIp through manualPoiEightIp). Must also update the duplicate submitRouterMode() in www/main.js if it exists.
priority: high
tags:
  - 8-poi
  - controls
  - phase-4
createdAt: "2026-04-28T14:03:55.929Z"
contract:
  status: delivered
  deliverables:
    - type: file
      path: www/utils.js
      description: getPoiIPs() updated for 8 POIs
    - type: file
      path: www/controls.js
      description: submitRouterMode() updated for savedRouterIPs POI 5-8
    - type: file
      path: www/main.js
      description: submitRouterMode() updated if duplicate exists
  metrics:
    readyAt: "2026-04-28T14:42:17.175Z"
    pickedUpAt: "2026-04-28T14:42:23.202Z"
    reworkCount: 0
    deliveredAt: "2026-04-28T14:46:02.237Z"
    duration: 219
updatedAt: "2026-04-28T14:46:02.237Z"
---

## Description
Update www/utils.js getPoiIPs() to include POI 5-8 when routerMode is true and their IP is not '0.0.0.0'. Update www/controls.js submitRouterMode() to handle savedRouterIPs for POI 5-8 in both the save (AP mode) and restore (Router mode) branches. Also update manual IP input references for POI 5-8 (manualPoiFiveIp through manualPoiEightIp). Must also update the duplicate submitRouterMode() in www/main.js if it exists.
