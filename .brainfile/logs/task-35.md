---
id: task-35
title: "Phase 7: Update Upload Tab for 8 POI support"
column: done
position: 0
description: "Update www/upload.js to support 8 POIs: (1) Update restoreOriginalPatterns() signature and body to accept parameters for all 8 POIs (default false for POIs 5-8), with conditional setPatternSafe() calls for POI 5-8 IPs; (2) Update handleUpload() to verify and process uploads for all 8 POIs when in router mode; (3) Update verifyPoiConnection() calls to check POI 5-8 connectivity when router mode is active. All new POIs are only processed when routerMode=true and IP != '0.0.0.0'."
priority: high
tags:
  - 8-poi
  - upload-tab
  - phase-7
createdAt: "2026-04-28T14:04:48.297Z"
updatedAt: "2026-04-28T15:24:23.055Z"
---

## Description
Update www/upload.js to support 8 POIs: (1) Update restoreOriginalPatterns() signature and body to accept parameters for all 8 POIs (default false for POIs 5-8), with conditional setPatternSafe() calls for POI 5-8 IPs; (2) Update handleUpload() to verify and process uploads for all 8 POIs when in router mode; (3) Update verifyPoiConnection() calls to check POI 5-8 connectivity when router mode is active. All new POIs are only processed when routerMode=true and IP != '0.0.0.0'.
