---
id: task-41
title: Expand POI File Lists from 2 to 8 POIs
description: Expand the File Lists tab (in index.html and files.js) from supporting only Main and Aux POIs to all 8 POIs. In index.html, add file list textareas for POI 3-8 (fileListTextAreaThree through fileListTextAreaEight) with router-only class. In files.js, add getFileListThree() through getFileListEight() functions following the existing getFileList()/getFileListTwo() pattern. Each function should fetch file list from the respective POI IP and display in the corresponding textarea.
priority: high
createdAt: "2026-05-25T05:18:30.882Z"
contract:
  status: delivered
  deliverables:
    - type: file
      path: www/index.html
      description: Add POI 3-8 file list textareas with router-only class
    - type: file
      path: www/files.js
      description: Add getFileListThree() through getFileListEight() functions
  validation:
    commands:
      - grep -q 'fileListTextAreaThree' www/index.html
      - grep -q 'fileListTextAreaEight' www/index.html
      - grep -q 'getFileListThree' www/files.js
      - grep -q 'getFileListEight' www/files.js
  metrics:
    pickedUpAt: "2026-05-25T05:21:59.491Z"
    reworkCount: 0
    deliveredAt: "2026-05-25T05:25:44.502Z"
    duration: 225
updatedAt: "2026-05-25T05:25:44.502Z"
completedAt: "2026-05-25T05:31:39.975Z"
---

## Description
Expand the File Lists tab (in index.html and files.js) from supporting only Main and Aux POIs to all 8 POIs. In index.html, add file list textareas for POI 3-8 (fileListTextAreaThree through fileListTextAreaEight) with router-only class. In files.js, add getFileListThree() through getFileListEight() functions following the existing getFileList()/getFileListTwo() pattern. Each function should fetch file list from the respective POI IP and display in the corresponding textarea.
