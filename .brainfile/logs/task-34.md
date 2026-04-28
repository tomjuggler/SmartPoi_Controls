---
id: task-34
title: "Phase 6: Update Images Tab for 8 POI support"
column: Done
position: 1
description: "Update www/images.js to support 8 POIs: (1) Update fetchInitialPixels() to fetch pixel counts for all 8 POIs using updatePixelDisplayForPoi(); (2) Update updatePixelsOnBoth() to send pixel updates to all connected POIs via getPoiIPs() instead of hardcoded main/aux; (3) Update refreshAllImages() to create black images for all 8 POI image grids; (4) Update deleteImageFromPoi() to handle POI-5-8 specific containers; (5) Update createBlackImages() calls for new POI grids. sendPatternToBothPOIs() already uses getPoiIPs() so should work without changes."
priority: high
tags:
  - 8-poi
  - images-tab
  - phase-6
createdAt: "2026-04-28T14:04:37.938Z"
updatedAt: "2026-04-28T15:24:16.336Z"
---

## Description
Update www/images.js to support 8 POIs: (1) Update fetchInitialPixels() to fetch pixel counts for all 8 POIs using updatePixelDisplayForPoi(); (2) Update updatePixelsOnBoth() to send pixel updates to all connected POIs via getPoiIPs() instead of hardcoded main/aux; (3) Update refreshAllImages() to create black images for all 8 POI image grids; (4) Update deleteImageFromPoi() to handle POI-5-8 specific containers; (5) Update createBlackImages() calls for new POI grids. sendPatternToBothPOIs() already uses getPoiIPs() so should work without changes.
