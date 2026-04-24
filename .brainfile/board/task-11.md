---
id: task-11
title: "Phase 2a: HTML - Add manual IP inputs for POI 3 & 4 in Network Discovery"
column: todo
position: 2
description: "In index.html, within the Network Discovery section (inside the manual-ip-section div), add 2 new manual-ip-row divs for POI 3 and POI 4. Each should have: an input with id \"manualPoiThreeIp\" (placeholder \"0.0.0.0\"), a button with onclick=\"setPoiThreeIp()\" labelled \"Set POI 3\", and an error span. Same for POI 4 with id \"manualPoiFourIp\" and onclick=\"setPoiFourIp()\". These should be visually indicated as optional and only relevant in Router Mode."
priority: high
tags:
  - 4-poi
  - html
  - network-discovery
  - phase-2
subtasks:
  - id: task-11-1
    title: Add manualPoiThreeIp input + Set button + error span
    completed: false
  - id: task-11-2
    title: Add manualPoiFourIp input + Set button + error span
    completed: false
  - id: task-11-3
    title: Add visual label 'Optional (Router Mode only)'
    completed: false
createdAt: "2026-04-24T06:26:46.888Z"
contract:
  status: draft
  constraints:
    - HTML for IP inputs — can be done in parallel with state changes
updatedAt: "2026-04-24T06:29:12.880Z"
---

## Description
In index.html, within the Network Discovery section (inside the manual-ip-section div), add 2 new manual-ip-row divs for POI 3 and POI 4. Each should have: an input with id "manualPoiThreeIp" (placeholder "0.0.0.0"), a button with onclick="setPoiThreeIp()" labelled "Set POI 3", and an error span. Same for POI 4 with id "manualPoiFourIp" and onclick="setPoiFourIp()". These should be visually indicated as optional and only relevant in Router Mode.
