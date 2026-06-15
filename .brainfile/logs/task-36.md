---
id: task-36
title: "Phase 8: Update Magic Bridge Tab for 8 POI support"
column: done
position: 17
description: "Update www/magic-bridge.js to support 8 POIs: (1) Update processAndUploadZip() to check connectivity and upload to POI 3-8 when router mode is active; (2) Update connectivity check section to verify POI 5-8; (3) Update upload promises section to include POI 5-8 uploads; (4) Update verifyPoiConnectionMB() if it has fixed POI parameters. All new POIs are only processed when routerMode=true and IP != '0.0.0.0'. Preserve existing Main/Aux behaviour for non-router mode."
priority: high
tags:
  - 8-poi
  - magic-bridge
  - phase-8
createdAt: "2026-04-28T14:04:55.326Z"
---

## Description
Update www/magic-bridge.js to support 8 POIs: (1) Update processAndUploadZip() to check connectivity and upload to POI 3-8 when router mode is active; (2) Update connectivity check section to verify POI 5-8; (3) Update upload promises section to include POI 5-8 uploads; (4) Update verifyPoiConnectionMB() if it has fixed POI parameters. All new POIs are only processed when routerMode=true and IP != '0.0.0.0'. Preserve existing Main/Aux behaviour for non-router mode.
