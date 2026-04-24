---
id: task-21
title: "Phase 5a: Update pattern functions to send to all 4 POIs"
column: todo
position: 12
description: |-
  In controls.js, update the pattern-related functions to send pattern commands to all 4 POIs instead of just 2. Update the following:
  - controlsSubmitPattern() — add fetch() calls for poiThreeIP and poiFourIP to the Promise.all
  - setPatternOnBoth() — rename conceptually to work with all 4 POIs, add calls for POI 3 & 4
  - Pattern updates should skip extra POIs whose IP is 0.0.0.0 (not configured)
  - highlightActiveButton() — no changes needed, pattern visual is global

  Also update images.js sendPatternToBothPOIs() similarly and utils.js restoreOriginalPatterns() to handle all 4 POIs.
priority: high
tags:
  - 4-poi
  - pattern
  - controls
  - phase-5
subtasks:
  - id: task-21-1
    title: Update controlsSubmitPattern() in controls.js for 4 POIs
    completed: false
  - id: task-21-2
    title: Update setPatternOnBoth() for 4 POIs
    completed: false
  - id: task-21-3
    title: Skip extra POIs when IP is 0.0.0.0
    completed: false
  - id: task-21-4
    title: Update sendPatternToBothPOIs() in images.js
    completed: false
  - id: task-21-5
    title: Update restoreOriginalPatterns() in utils.js and upload.js
    completed: false
createdAt: "2026-04-24T06:28:28.791Z"
contract:
  status: draft
  constraints:
    - Depends on state.poiIPs having poiThreeIP/poiFourIP
updatedAt: "2026-04-24T06:29:12.880Z"
dependsOn:
  - task-10
---

## Description
In controls.js, update the pattern-related functions to send pattern commands to all 4 POIs instead of just 2. Update the following:
- controlsSubmitPattern() — add fetch() calls for poiThreeIP and poiFourIP to the Promise.all
- setPatternOnBoth() — rename conceptually to work with all 4 POIs, add calls for POI 3 & 4
- Pattern updates should skip extra POIs whose IP is 0.0.0.0 (not configured)
- highlightActiveButton() — no changes needed, pattern visual is global

Also update images.js sendPatternToBothPOIs() similarly and utils.js restoreOriginalPatterns() to handle all 4 POIs.
