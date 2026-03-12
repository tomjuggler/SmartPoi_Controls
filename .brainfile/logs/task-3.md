---
id: task-3
title: "TEXT-004: Add filename selection UI for POI upload"
description: |-
  Create UI for selecting target filename and POI destination

  **Objective**: Implement user interface for selecting where to upload generated text image

  **Key Requirements**:
  1. Create filename selection dropdown/input (a.bin, b.bin, etc.)
  2. Add POI selection toggle (Main/Aux)
  3. Show existing files on selected POI for replacement
  4. Implement filename validation
  5. Add visual feedback for selection state

  **Constraints**:
  - Reuse existing file listing functions from files.js
  - Follow existing UI patterns for dropdowns/toggles
  - Validate filenames against POI constraints
  - Show connection status for selected POI
priority: medium
tags:
  - ui
  - forms
  - validation
  - integration
createdAt: "2026-03-12T09:25:04.793Z"
contract:
  status: ready
  deliverables:
    - type: file
      path: www/text-tab-ui.js
    - type: file
      path: www/text-tab-ui.css
    - type: test
      path: .brainfile/tests/filename-selection-test.html
  validation:
    commands:
      - grep -n 'getFileList' www/text-tab-ui.js
      - grep -n 'validateFileName' www/text-tab-ui.js
      - test -f www/text-tab-ui.css
  constraints:
    - Reuse existing validation from upload.js
    - Follow existing UI component patterns
    - No modifications to files.js
completedAt: "2026-03-12T11:05:03.308Z"
updatedAt: "2026-03-12T11:05:03.308Z"
---

## Description
Create UI for selecting target filename and POI destination

**Objective**: Implement user interface for selecting where to upload generated text image

**Key Requirements**:
1. Create filename selection dropdown/input (a.bin, b.bin, etc.)
2. Add POI selection toggle (Main/Aux)
3. Show existing files on selected POI for replacement
4. Implement filename validation
5. Add visual feedback for selection state

**Constraints**:
- Reuse existing file listing functions from files.js
- Follow existing UI patterns for dropdowns/toggles
- Validate filenames against POI constraints
- Show connection status for selected POI
