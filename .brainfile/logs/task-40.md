---
id: task-40
title: Add .router-only CSS class to styles.css
description: "Add the .router-only CSS utility class to styles.css. This class is already referenced in index.html for conditional visibility of POI 3-8 elements but not yet defined in CSS. When routerMode is active, elements with .router-only should be visible; when in AP mode, they should be hidden (display: none). The class toggling is done via updateNetworkModeDisplay() in utils.js which sets style.display on these elements."
priority: medium
createdAt: "2026-05-25T05:18:20.290Z"
contract:
  status: delivered
  deliverables:
    - type: file
      path: www/styles.css
      description: Add .router-only CSS class definition
  validation:
    commands:
      - grep -q 'router-only' www/styles.css
  metrics:
    pickedUpAt: "2026-05-25T05:21:53.224Z"
    reworkCount: 0
    deliveredAt: "2026-05-25T05:25:37.872Z"
    duration: 225
updatedAt: "2026-05-25T05:25:37.872Z"
completedAt: "2026-05-25T05:31:32.204Z"
---

## Description
Add the .router-only CSS utility class to styles.css. This class is already referenced in index.html for conditional visibility of POI 3-8 elements but not yet defined in CSS. When routerMode is active, elements with .router-only should be visible; when in AP mode, they should be hidden (display: none). The class toggling is done via updateNetworkModeDisplay() in utils.js which sets style.display on these elements.
