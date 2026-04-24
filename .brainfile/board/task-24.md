---
id: task-24
title: "Phase 5d: Update channel/router submission to send to all 4 POIs"
column: todo
position: 15
description: In controls.js, update submitChannel() and submitRouter() to send requests to all 4 POIs. Currently both functions send to mainIP and auxIP only. Add sendRequest() calls for poiThreeIP and poiFourIP (skipping 0.0.0.0). Also update the main.js copy of submitRouterMode() to send the router mode toggle request to all 4 POIs. The logic for switching IPs between Router and AP mode should also handle saving/restoring all 4 IPs.
priority: high
tags:
  - 4-poi
  - channel
  - router
  - danger-zone
  - phase-5
subtasks:
  - id: task-24-1
    title: Update submitChannel() in controls.js for 4 POIs
    completed: false
  - id: task-24-2
    title: Update submitRouter() in controls.js for 4 POIs
    completed: false
  - id: task-24-3
    title: Update submitRouterMode() in controls.js for saving/restoring all 4 IPs
    completed: false
  - id: task-24-4
    title: Update submitRouterMode() in main.js for sending toggle to all 4 POIs
    completed: false
  - id: task-24-5
    title: Skip extra POIs when IP is 0.0.0.0
    completed: false
createdAt: "2026-04-24T06:28:55.673Z"
contract:
  status: draft
  constraints:
    - Depends on state fields and router mode logic handling 4 IPs
updatedAt: "2026-04-24T06:29:12.880Z"
dependsOn:
  - task-10
  - task-14
---

## Description
In controls.js, update submitChannel() and submitRouter() to send requests to all 4 POIs. Currently both functions send to mainIP and auxIP only. Add sendRequest() calls for poiThreeIP and poiFourIP (skipping 0.0.0.0). Also update the main.js copy of submitRouterMode() to send the router mode toggle request to all 4 POIs. The logic for switching IPs between Router and AP mode should also handle saving/restoring all 4 IPs.
