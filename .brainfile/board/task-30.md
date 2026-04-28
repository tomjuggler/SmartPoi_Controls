---
id: task-30
title: "Phase 4b: Update initializeFetchButton() for 8 POI settings fetch"
column: review
position: 11
description: Update www/controls.js initializeFetchButton() to extend settings fetching from 4 to 8 POIs. Add conditional fetch calls for POI 5-8 (checking routerMode and IP != '0.0.0.0'), update result destructuring, and add DOM display updates for each POI's settings (router, password, channel, pattern, pixels). Follow the existing pattern from POI 3/4 additions. Also update the duplicate in www/main.js.
priority: high
tags:
  - 8-poi
  - controls
  - phase-4
createdAt: "2026-04-28T14:04:04.355Z"
contract:
  status: delivered
  deliverables:
    - type: file
      path: www/main.js
      description: initializeFetchButton() extended for POI 3-8
  metrics:
    readyAt: "2026-04-28T14:47:27.492Z"
    pickedUpAt: "2026-04-28T14:47:37.307Z"
    reworkCount: 0
    deliveredAt: "2026-04-28T14:55:57.066Z"
    duration: 500
updatedAt: "2026-04-28T14:55:57.066Z"
---

## Description
Update www/controls.js initializeFetchButton() to extend settings fetching from 4 to 8 POIs. Add conditional fetch calls for POI 5-8 (checking routerMode and IP != '0.0.0.0'), update result destructuring, and add DOM display updates for each POI's settings (router, password, channel, pattern, pixels). Follow the existing pattern from POI 3/4 additions. Also update the duplicate in www/main.js.
