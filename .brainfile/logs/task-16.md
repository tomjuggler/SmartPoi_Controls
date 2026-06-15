---
id: task-16
title: "Phase 3c: Update updateStatusIndicators() to check all 4 POIs"
column: done
position: 7
description: In network.js, update the updateStatusIndicators() function to additionally check poiThreeIP and poiFourIP. Currently it only checks mainIP and auxIP. Add Promise.allSettled entries for the extra POIs, updating new DOM elements poiThreeStatus and poiFourStatus with 'online'/'offline' class and text. The extra POI checks should only run when state.poiIPs.routerMode is true AND the IP is not "0.0.0.0" (indicating it hasn't been set yet).
priority: high
tags:
  - 4-poi
  - status
  - network-discovery
  - phase-3
subtasks:
  - id: task-16-1
    title: Add checkStatus() calls for poiThreeIP and poiFourIP
    completed: false
  - id: task-16-2
    title: Only check extra POIs when routerMode=true and IP != 0.0.0.0
    completed: false
  - id: task-16-3
    title: Update poiThreeStatus and poiFourStatus DOM elements
    completed: false
  - id: task-16-4
    title: Handle edge case where extra POIs are not configured
    completed: false
createdAt: "2026-04-24T06:27:38.748Z"
contract:
  status: delivered
  constraints:
    - Depends on status indicator HTML elements existing
  metrics:
    pickedUpAt: "2026-04-24T06:53:50.100Z"
    reworkCount: 0
    deliveredAt: "2026-04-24T06:54:56.095Z"
    duration: 66
updatedAt: "2026-04-24T06:54:56.095Z"
dependsOn:
  - task-12
---

## Description
In network.js, update the updateStatusIndicators() function to additionally check poiThreeIP and poiFourIP. Currently it only checks mainIP and auxIP. Add Promise.allSettled entries for the extra POIs, updating new DOM elements poiThreeStatus and poiFourStatus with 'online'/'offline' class and text. The extra POI checks should only run when state.poiIPs.routerMode is true AND the IP is not "0.0.0.0" (indicating it hasn't been set yet).
