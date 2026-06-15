---
id: task-15
title: "Phase 3b: Add networkSetPoiThreeIp() and networkSetPoiFourIp() functions"
column: done
position: 6
description: "In network.js, add 2 new functions: window.networkSetPoiThreeIp() and window.networkSetPoiFourIp(). These follow the same pattern as networkSetMainIp/networkSetAuxIp: check routerMode is active, validate the IP input, save to state.poiIPs.poiThreeIP/poiFourIP, persist with saveState(), update status indicators, and show a confirmation message. Also add global wrapper functions setPoiThreeIp() and setPoiFourIp() in main.js (like setMainIp/setAuxIp) that call the network functions."
priority: high
tags:
  - 4-poi
  - network-discovery
  - phase-3
subtasks:
  - id: task-15-1
    title: Add networkSetPoiThreeIp() in network.js
    completed: false
  - id: task-15-2
    title: Add networkSetPoiFourIp() in network.js
    completed: false
  - id: task-15-3
    title: Add setPoiThreeIp() global wrapper in main.js
    completed: false
  - id: task-15-4
    title: Add setPoiFourIp() global wrapper in main.js
    completed: false
  - id: task-15-5
    title: Wire up updateStatusIndicators() calls in new functions
    completed: false
createdAt: "2026-04-24T06:27:26.285Z"
contract:
  status: delivered
  constraints:
    - Depends on HTML inputs existing and fastScanNetwork returning 4 IPs
  metrics:
    pickedUpAt: "2026-04-24T06:51:41.021Z"
    reworkCount: 0
    deliveredAt: "2026-04-24T06:53:45.341Z"
    duration: 124
updatedAt: "2026-04-24T06:53:45.341Z"
dependsOn:
  - task-11
  - task-14
---

## Description
In network.js, add 2 new functions: window.networkSetPoiThreeIp() and window.networkSetPoiFourIp(). These follow the same pattern as networkSetMainIp/networkSetAuxIp: check routerMode is active, validate the IP input, save to state.poiIPs.poiThreeIP/poiFourIP, persist with saveState(), update status indicators, and show a confirmation message. Also add global wrapper functions setPoiThreeIp() and setPoiFourIp() in main.js (like setMainIp/setAuxIp) that call the network functions.
