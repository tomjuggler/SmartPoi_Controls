---
id: task-45
title: "Final verification: All features work for 8 POIs in Router mode, 2 POIs in AP mode"
description: "Do a comprehensive final check to ensure ALL features now work for 8 POIs (not just the original 2) when in Router mode. Verify: Image Management has all 8 grids, File Lists show all 8 POIs, Controls send to all 8, Magic Bridge uploads to all 8, Upload handles all 8, Danger Zone (channel/router/mode) targets all 8. In AP mode, verify ONLY 2 POIs are shown/targeted. Exception: Text to POI only works for Main/Aux in AP mode (documented). Check that all router-only elements show/hide correctly when toggling Router Mode checkbox."
priority: critical
createdAt: "2026-05-25T05:19:20.060Z"
contract:
  status: delivered
  deliverables:
    - type: research
      path: Check all 8 image grids present in HTML
    - type: research
      path: Check all 8 file list textareas present
    - type: research
      path: Verify getPoiIPs() returns correct count per mode
    - type: research
      path: Verify router-only class applied consistently
    - type: research
      path: Verify Text-to-POI limited to AP mode 2 POIs
  validation:
    commands:
      - bash -c 'grep -c image-grid-container www/index.html | xargs -I{} test {} -eq 8'
      - bash -c 'grep -c "fileListTextArea" www/index.html | xargs -I{} test {} -ge 8'
      - grep -q 'router-only' www/styles.css
  metrics:
    pickedUpAt: "2026-05-25T05:28:24.821Z"
    reworkCount: 0
    deliveredAt: "2026-05-25T05:31:04.348Z"
    duration: 160
updatedAt: "2026-05-25T05:31:04.348Z"
completedAt: "2026-05-25T05:32:17.219Z"
---

## Description
Do a comprehensive final check to ensure ALL features now work for 8 POIs (not just the original 2) when in Router mode. Verify: Image Management has all 8 grids, File Lists show all 8 POIs, Controls send to all 8, Magic Bridge uploads to all 8, Upload handles all 8, Danger Zone (channel/router/mode) targets all 8. In AP mode, verify ONLY 2 POIs are shown/targeted. Exception: Text to POI only works for Main/Aux in AP mode (documented). Check that all router-only elements show/hide correctly when toggling Router Mode checkbox.
