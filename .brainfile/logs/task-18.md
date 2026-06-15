---
id: task-18
title: "Phase 4a: Update fetchSettings() and initializeFetchButton() for 4 POIs"
column: done
position: 9
description: In controls.js, update fetchSettings() to return fields for POI 3 & 4 along with the existing POIs. Then update initializeFetchButton() to call fetchSettings() for all 4 IPs, and update the DOM display sections for POI 3 and POI 4 (routerThree, passwordThree, channelThree, patternThree, pixelsThree and similarly for POI 4). Also update the 'catch' error handler to gracefully handle missing extra POIs. The extra fetch calls should only be made when routerMode is true and the IP is not 0.0.0.0.
priority: high
tags:
  - 4-poi
  - fetch-settings
  - controls
  - phase-4
subtasks:
  - id: task-18-1
    title: Update fetchSettings() — already generic for any IP, review for compatibility
    completed: false
  - id: task-18-2
    title: Update initializeFetchButton() to fetch settings for 4 POIs
    completed: false
  - id: task-18-3
    title: Update DOM display sections for POI 3 and POI 4
    completed: false
  - id: task-18-4
    title: Only fetch extra POIs when routerMode=true and IP != 0.0.0.0
    completed: false
  - id: task-18-5
    title: Update error handler in catch block for new POI sections
    completed: false
createdAt: "2026-04-24T06:27:58.329Z"
contract:
  status: delivered
  constraints:
    - Depends on state fields + HTML Fetch Settings sections
  metrics:
    pickedUpAt: "2026-04-24T06:57:28.970Z"
    reworkCount: 0
    deliveredAt: "2026-04-24T07:01:53.790Z"
    duration: 265
updatedAt: "2026-04-24T07:01:53.790Z"
dependsOn:
  - task-10
  - task-13
---

## Description
In controls.js, update fetchSettings() to return fields for POI 3 & 4 along with the existing POIs. Then update initializeFetchButton() to call fetchSettings() for all 4 IPs, and update the DOM display sections for POI 3 and POI 4 (routerThree, passwordThree, channelThree, patternThree, pixelsThree and similarly for POI 4). Also update the 'catch' error handler to gracefully handle missing extra POIs. The extra fetch calls should only be made when routerMode is true and the IP is not 0.0.0.0.
