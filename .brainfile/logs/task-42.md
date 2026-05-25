---
id: task-42
title: Add AP-mode-only note to Text to POI How to Use section
description: Add a note to the "How to Use" section in text-tab.html clarifying that Text to POI functionality ONLY works in AP mode for Main and Aux POIs (2 POIs only, fixed IPs). This is the one exception to the 8-POI upgrade — Text to POI does not support POI 3-8 even in Router mode. Add a clear, visible note explaining this limitation.
priority: medium
createdAt: "2026-05-25T05:18:44.387Z"
contract:
  status: delivered
  deliverables:
    - type: file
      path: www/text-tab.html
      description: Add AP-mode limitation note to How to Use section
  validation:
    commands:
      - grep -q 'AP mode' www/text-tab.html
      - grep -q 'Main POI.*Aux POI' www/text-tab.html
  metrics:
    deliveredAt: "2026-05-25T05:25:51.394Z"
updatedAt: "2026-05-25T05:25:51.394Z"
completedAt: "2026-05-25T05:31:47.026Z"
---

## Description
Add a note to the "How to Use" section in text-tab.html clarifying that Text to POI functionality ONLY works in AP mode for Main and Aux POIs (2 POIs only, fixed IPs). This is the one exception to the 8-POI upgrade — Text to POI does not support POI 3-8 even in Router mode. Add a clear, visible note explaining this limitation.
