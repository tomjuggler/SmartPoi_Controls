---
id: task-43
title: Verify Magic Bridge and Controls support all 8 POIs
description: Verify that Smart Magic Bridge (magic-bridge.js) properly supports multi-POI uploads to all 8 POIs. Check that all Controls (controls.js) support controlling all 8 POIs simultaneously — including Danger Zone fields (submitChannel, submitRouter, submitRouterMode). Review that all functions use getPoiIPs() or equivalent patterns, and that no function hardcodes main/aux only. Check the git diff against main to verify completeness.
priority: high
createdAt: "2026-05-25T05:18:55.525Z"
contract:
  status: delivered
  deliverables:
    - type: file
      path: www/controls.js
      description: Verify all control functions use getPoiIPs() for multi-POI support
    - type: file
      path: www/magic-bridge.js
      description: Verify Magic Bridge supports all 8 POIs
  validation:
    commands:
      - grep -q 'getPoiIPs' www/controls.js
      - grep -q 'poiEightIP' www/magic-bridge.js
      - grep -q 'poiEightIP' www/controls.js
  metrics:
    pickedUpAt: "2026-05-25T05:26:20.572Z"
    reworkCount: 0
    deliveredAt: "2026-05-25T05:27:32.556Z"
    duration: 72
updatedAt: "2026-05-25T05:27:32.556Z"
completedAt: "2026-05-25T05:31:59.632Z"
---

## Description
Verify that Smart Magic Bridge (magic-bridge.js) properly supports multi-POI uploads to all 8 POIs. Check that all Controls (controls.js) support controlling all 8 POIs simultaneously — including Danger Zone fields (submitChannel, submitRouter, submitRouterMode). Review that all functions use getPoiIPs() or equivalent patterns, and that no function hardcodes main/aux only. Check the git diff against main to verify completeness.
