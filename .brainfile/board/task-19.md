---
id: task-19
title: "Phase 4b: Update updatePixelDisplayForPoi() for POI 3 and POI 4"
column: review
position: 10
description: |-
  In utils.js, update updatePixelDisplayForPoi() to handle 'three' and 'four' POI types. Currently it handles 'main' (updates state.settings.pixels + calls updateAllPixelDisplays() which sets global pixelInput/uploadPixelInput) and 'aux' (updates state.settings.pixelsTwo + pixelsTwo element only).

  For 'three' and 'four':
  - Behaves like 'aux' — updates ONLY its own display element (pixelsThree/pixelsFour) and its own state setting (state.settings.pixelsThree/pixelsFour)
  - MUST NOT call updateAllPixelDisplays() or modify the global pixelInput/uploadPixelInput
  - This preserves per-POI pixel independence: POI 3/4 can have different pixel counts than POI 1/2

  Also update fetchNumberOfPixels() — already generic for any IP, no changes needed.
priority: high
tags:
  - 4-poi
  - utils
  - pixels
  - phase-4
subtasks:
  - id: task-19-1
    title: Add 'three' case to updatePixelDisplayForPoi()
    completed: false
  - id: task-19-2
    title: Add 'four' case to updatePixelDisplayForPoi()
    completed: false
  - id: task-19-3
    title: Update state.settings.pixelsThree/pixelsFour on POI type match
    completed: false
  - id: task-19-4
    title: Ensure existing elements (pixelsThree, pixelsFour) exist in DOM
    completed: false
createdAt: "2026-04-24T06:28:10.898Z"
contract:
  status: delivered
  constraints:
    - Depends on state fields + HTML elements for pixel display
  metrics:
    pickedUpAt: "2026-04-24T07:02:18.163Z"
    reworkCount: 0
    deliveredAt: "2026-04-24T07:06:52.024Z"
    duration: 274
updatedAt: "2026-04-24T07:06:52.024Z"
dependsOn:
  - task-10
  - task-13
---

## Description
In utils.js, update updatePixelDisplayForPoi() to handle 'three' and 'four' POI types. Currently it handles 'main' (updates all pixel displays) and 'aux' (updates pixelsTwo display only). Add cases for 'three' (updates pixelsThree element) and 'four' (updates pixelsFour element). Also update updateAllPixelDisplays() if needed. Also check fetchNumberOfPixels() is already generic for any IP — it is, so no changes needed there.
