---
id: task-38
title: Fix Image Management context menu (right-click + long press)
description: "Fix the broken context menu on image cards (a.bin, b.bin, etc.) in the Image Management tab. The issue: right-click (contextmenu event) was never implemented for desktop, and the long-press mechanism via mousedown/touchstart conflicts with the click-to-preview handler. Add proper contextmenu event listener for right-click on desktop, fix long-press on mobile so it doesn't trigger the click handler, and ensure the context menu works for ALL image grids (main, aux, and POI 3-8). Reference main branch for last known working state."
priority: high
createdAt: "2026-05-25T05:17:59.788Z"
contract:
  status: delivered
  deliverables:
    - type: file
      path: www/images.js
      description: Add contextmenu event listener alongside existing touch/mouse handlers in createBlackImages(). Fix click handler conflict with long press by checking if context menu was triggered.
  validation:
    commands:
      - grep -q 'contextmenu' www/images.js
      - grep -q 'preventDefault.*contextmenu' www/images.js
  metrics:
    pickedUpAt: "2026-05-25T05:19:42.999Z"
    reworkCount: 0
    deliveredAt: "2026-05-25T05:21:12.283Z"
    duration: 89
updatedAt: "2026-05-25T05:21:12.283Z"
completedAt: "2026-05-25T05:31:19.346Z"
---

## Description
Fix the broken context menu on image cards (a.bin, b.bin, etc.) in the Image Management tab. The issue: right-click (contextmenu event) was never implemented for desktop, and the long-press mechanism via mousedown/touchstart conflicts with the click-to-preview handler. Add proper contextmenu event listener for right-click on desktop, fix long-press on mobile so it doesn't trigger the click handler, and ensure the context menu works for ALL image grids (main, aux, and POI 3-8). Reference main branch for last known working state.
