---
id: task-33
title: "Phase 5: Update Text Tab for 8 POI selection and upload"
column: Done
position: 0
description: Update the Text Tab (www/text-tab.html, www/text-tab.js) to support 8 POI selection. (1) Add POI 3-8 selection buttons to text-tab.html following the existing .poi-btn pattern with data-poi attributes ('three','four','five','six','seven','eight','all'). (2) Update getSelectedPoi() in text-tab.js to handle new POI values. (3) Update handleUpload() in text-tab.js to build target IPs list from all 8 POIs (checking routerMode and IP validity for POIs 3-8). Must preserve existing Main/Aux/Both behaviour as default for non-router mode.
priority: high
tags:
  - 8-poi
  - text-tab
  - phase-5
createdAt: "2026-04-28T14:04:30.000Z"
updatedAt: "2026-04-28T15:06:52.839Z"
---

## Description
Update the Text Tab (www/text-tab.html, www/text-tab.js) to support 8 POI selection. (1) Add POI 3-8 selection buttons to text-tab.html following the existing .poi-btn pattern with data-poi attributes ('three','four','five','six','seven','eight','all'). (2) Update getSelectedPoi() in text-tab.js to handle new POI values. (3) Update handleUpload() in text-tab.js to build target IPs list from all 8 POIs (checking routerMode and IP validity for POIs 3-8). Must preserve existing Main/Aux/Both behaviour as default for non-router mode.
