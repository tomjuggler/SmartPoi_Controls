---
id: task-44
title: Verify AP mode request batching (no overwhelming embedded stack)
description: "Verify that in AP mode (routerMode=false), the app does NOT send too many simultaneous requests to each POI (especially the embedded network stack can be overwhelmed). Check that getPoiIPs() correctly limits to 2 IPs in AP mode. Check that upload.js uses proper inter-POI delays and batching. Check that Magic Bridge and Controls don't fire excessive parallel requests. The key concern: when routerMode is off, only mainIP and auxIP should be targeted, and requests should be properly throttled."
priority: high
createdAt: "2026-05-25T05:19:06.751Z"
contract:
  status: delivered
  deliverables:
    - type: file
      path: www/utils.js
      description: Verify getPoiIPs() only returns 2 IPs in AP mode
    - type: file
      path: www/upload.js
      description: Verify upload batching doesn't overwhelm embedded network stack
  validation:
    commands:
      - grep -q 'routerMode.*poiThreeIP' www/utils.js
      - grep -q 'INTER_POI_DELAY' www/upload.js
  metrics:
    pickedUpAt: "2026-05-25T05:27:50.192Z"
    reworkCount: 0
    deliveredAt: "2026-05-25T05:28:13.276Z"
    duration: 23
updatedAt: "2026-05-25T05:28:13.276Z"
completedAt: "2026-05-25T05:32:07.708Z"
---

## Description
Verify that in AP mode (routerMode=false), the app does NOT send too many simultaneous requests to each POI (especially the embedded network stack can be overwhelmed). Check that getPoiIPs() correctly limits to 2 IPs in AP mode. Check that upload.js uses proper inter-POI delays and batching. Check that Magic Bridge and Controls don't fire excessive parallel requests. The key concern: when routerMode is off, only mainIP and auxIP should be targeted, and requests should be properly throttled.
