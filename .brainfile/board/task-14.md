---
id: task-14
title: "Phase 3a: Update fastScanNetwork() and initializeNetworkDiscovery() for 4 POIs"
column: review
position: 5
description: In network.js, update fastScanNetwork() to return up to 4 devices instead of 2. The function currently returns { mainIP, auxIP, foundDevices }. Extend to return { mainIP, auxIP, poiThreeIP, poiFourIP, foundDevices }. Also update initializeNetworkDiscovery() to assign poiThreeIP (foundDevices[2]) and poiFourIP (foundDevices[3]) after scanning, defaulting to "0.0.0.0" if fewer than 4 devices are found. Save the new IPs into state and update the manual IP input fields.
priority: high
tags:
  - 4-poi
  - network-discovery
  - phase-3
subtasks:
  - id: task-14-1
    title: Update fastScanNetwork() to return poiThreeIP and poiFourIP
    completed: false
  - id: task-14-2
    title: Update initializeNetworkDiscovery() to populate all 4 IP fields
    completed: false
  - id: task-14-3
    title: Default extra IPs to 0.0.0.0 when fewer than 4 devices found
    completed: false
  - id: task-14-4
    title: Save new IPs to state and update input field values
    completed: false
createdAt: "2026-04-24T06:27:16.978Z"
contract:
  status: delivered
  constraints:
    - Depends on state having poiThreeIP/poiFourIP in poiIPs
  metrics:
    pickedUpAt: "2026-04-24T06:48:44.038Z"
    reworkCount: 0
    deliveredAt: "2026-04-24T06:51:18.166Z"
    duration: 154
updatedAt: "2026-04-24T06:51:18.166Z"
dependsOn:
  - task-10
---

## Description
In network.js, update fastScanNetwork() to return up to 4 devices instead of 2. The function currently returns { mainIP, auxIP, foundDevices }. Extend to return { mainIP, auxIP, poiThreeIP, poiFourIP, foundDevices }. Also update initializeNetworkDiscovery() to assign poiThreeIP (foundDevices[2]) and poiFourIP (foundDevices[3]) after scanning, defaulting to "0.0.0.0" if fewer than 4 devices are found. Save the new IPs into state and update the manual IP input fields.
