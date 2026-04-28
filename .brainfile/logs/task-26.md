---
id: task-26
title: "Phase 3b: Add networkSetPoiFiveIp() through networkSetPoiEightIp() + global wrappers"
column: done
position: 7
description: Add IP setter functions for POI 5-8 in www/network.js following the pattern from networkSetPoiThreeIp()/networkSetPoiFourIp(). Also add global wrapper functions in www/main.js following setPoiThreeIp()/setPoiFourIp() pattern. Each function sets the IP in state.poiIPs, updates the manual IP input and saves state.
priority: high
tags:
  - 8-poi
  - network
  - phase-3
createdAt: "2026-04-28T14:03:27.861Z"
contract:
  status: delivered
  deliverables:
    - type: file
      path: www/network.js
      description: networkSetPoiFiveIp() through networkSetPoiEightIp() functions
    - type: file
      path: www/main.js
      description: setPoiFiveIp() through setPoiEightIp() global wrappers
  metrics:
    readyAt: "2026-04-28T14:37:51.714Z"
    pickedUpAt: "2026-04-28T14:37:57.301Z"
    reworkCount: 0
    deliveredAt: "2026-04-28T14:39:02.828Z"
    duration: 66
updatedAt: "2026-04-28T14:39:02.828Z"
---

## Description
Add IP setter functions for POI 5-8 in www/network.js following the pattern from networkSetPoiThreeIp()/networkSetPoiFourIp(). Also add global wrapper functions in www/main.js following setPoiThreeIp()/setPoiFourIp() pattern. Each function sets the IP in state.poiIPs, updates the manual IP input and saves state.
