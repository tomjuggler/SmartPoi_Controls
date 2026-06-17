---
id: task-50
title: "Refactor Magic Bridge: Separate ZIP extraction from upload"
description: |-
  In Smart Magic Bridge, ZIP extraction and upload are coupled in processAndUploadZip(). We need to:
  1. Create a data cache at module level (extractedFiles, timelineData, timingsArray, binArrayBuffers, mp3BlobUrl, isLoaded)
  2. previewTimelineFromZip() should populate the cache (already does extraction + TimelinePlayer init)
  3. processAndUploadZip() should use cached data instead of re-extracting - only do upload part
  4. clearUpload() should clear the cache and reset TimelinePlayer
  5. If user clicks upload without loading first, processAndUploadZip should still work by extracting if cache is empty
priority: high
tags:
  - magic-bridge
  - refactor
  - timeline
  - upload
createdAt: "2026-06-16T06:08:57.877Z"
contract:
  status: draft
  deliverables:
    - type: file
      path: www/magic-bridge.js
      description: Refactored magic-bridge.js with separate extract/upload flow
updatedAt: "2026-06-16T06:11:11.656Z"
completedAt: "2026-06-16T06:11:11.656Z"
---

## Description
In Smart Magic Bridge, ZIP extraction and upload are coupled in processAndUploadZip(). We need to:
1. Create a data cache at module level (extractedFiles, timelineData, timingsArray, binArrayBuffers, mp3BlobUrl, isLoaded)
2. previewTimelineFromZip() should populate the cache (already does extraction + TimelinePlayer init)
3. processAndUploadZip() should use cached data instead of re-extracting - only do upload part
4. clearUpload() should clear the cache and reset TimelinePlayer
5. If user clicks upload without loading first, processAndUploadZip should still work by extracting if cache is empty
