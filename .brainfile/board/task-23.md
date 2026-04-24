---
id: task-23
title: "Phase 5c: Update sync function to sync all 4 POIs"
column: todo
position: 14
description: In controls.js, update initializeSync() to send the sync command (/resetimagetouse) to all 4 POIs instead of just the main and aux. Add fetch() calls for poiThreeIP and poiFourIP to the Promise.all. Skip extra POIs whose IP is 0.0.0.0 (not configured). Update the success message to reflect that all configured POIs were synchronized.
priority: high
tags:
  - 4-poi
  - sync
  - controls
  - phase-5
subtasks:
  - id: task-23-1
    title: Add fetch calls for POI 3 and POI 4 in initializeSync()
    completed: false
  - id: task-23-2
    title: Skip extra POIs when IP is 0.0.0.0
    completed: false
  - id: task-23-3
    title: Update success message to reflect number of synced POIs
    completed: false
createdAt: "2026-04-24T06:28:44.804Z"
contract:
  status: draft
  constraints:
    - Depends on state.poiIPs having all 4 IPs
updatedAt: "2026-04-24T06:29:12.880Z"
dependsOn:
  - task-10
---

## Description
In controls.js, update initializeSync() to send the sync command (/resetimagetouse) to all 4 POIs instead of just the main and aux. Add fetch() calls for poiThreeIP and poiFourIP to the Promise.all. Skip extra POIs whose IP is 0.0.0.0 (not configured). Update the success message to reflect that all configured POIs were synchronized.
