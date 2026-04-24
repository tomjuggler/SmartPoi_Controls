---
id: task-17
title: "Phase 3d: Update updateNetworkModeDisplay() for extra IP inputs"
column: review
position: 8
description: "In utils.js, update updateNetworkModeDisplay() to handle the 2 new manual IP input fields. When routerMode is active: show/enable manualPoiThreeIp and manualPoiFourIp inputs. When AP mode: disable these inputs and show placeholder values. Also create a CSS class (e.g., .extra-poi-input or .router-only) in styles.css that can be used to conditionally show/hide elements. The extra POI sections should only render meaningfully in Router Mode."
priority: high
tags:
  - 4-poi
  - network-display
  - phase-3
subtasks:
  - id: task-17-1
    title: Update updateNetworkModeDisplay() for manualPoiThreeIp/manualPoiFourIp
    completed: false
  - id: task-17-2
    title: Disable extra IP inputs in AP mode
    completed: false
  - id: task-17-3
    title: Add CSS utility class for router-only visibility
    completed: false
  - id: task-17-4
    title: Set placeholder values for extra IP inputs from state
    completed: false
createdAt: "2026-04-24T06:27:48.171Z"
contract:
  status: delivered
  constraints:
    - Depends on extra IP input fields existing in DOM
  metrics:
    pickedUpAt: "2026-04-24T06:55:43.968Z"
    reworkCount: 1
    deliveredAt: "2026-04-24T06:57:08.327Z"
    duration: 84
updatedAt: "2026-04-24T06:57:08.327Z"
dependsOn:
  - task-11
---

## Description
In utils.js, update updateNetworkModeDisplay() to handle the 2 new manual IP input fields. When routerMode is active: show/enable manualPoiThreeIp and manualPoiFourIp inputs. When AP mode: disable these inputs and show placeholder values. Also create a CSS class (e.g., .extra-poi-input or .router-only) in styles.css that can be used to conditionally show/hide elements. The extra POI sections should only render meaningfully in Router Mode.
