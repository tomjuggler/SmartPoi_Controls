---
id: task-6
title: "TEXT-007: Add POI selection and connection management"
column: todo
position: 6
description: |-
  Implement POI selection and connection verification for text upload

  **Objective**: Add UI and logic for selecting target POI and verifying connection

  **Key Requirements**:
  1. Create POI selection toggle (Main/Aux)
  2. Implement connection verification using existing checkDevice()
  3. Show connection status indicators
  4. Handle offline/connection error states
  5. Integrate with existing network.js functions

  **Constraints**:
  - Reuse existing checkDevice() and network status functions
  - Follow existing UI patterns for status indicators
  - Maintain compatibility with existing POI IP management
  - Handle connection failures gracefully
priority: medium
tags:
  - network
  - ui
  - connection
  - integration
createdAt: "2026-03-12T09:27:27.838Z"
contract:
  status: ready
  deliverables:
    - type: file
      path: www/text-poi-selection.js
    - type: file
      path: www/text-poi-selection.css
    - type: test
      path: .brainfile/tests/poi-selection-test.html
  validation:
    commands:
      - grep -n 'checkDevice' www/text-poi-selection.js
      - grep -n 'state.poiIPs' www/text-poi-selection.js
      - test -f www/text-poi-selection.css
  constraints:
    - No modifications to network.js
    - Reuse existing status indicator patterns
    - Must work with existing POI IP configuration
---

## Description
Implement POI selection and connection verification for text upload

**Objective**: Add UI and logic for selecting target POI and verifying connection

**Key Requirements**:
1. Create POI selection toggle (Main/Aux)
2. Implement connection verification using existing checkDevice()
3. Show connection status indicators
4. Handle offline/connection error states
5. Integrate with existing network.js functions

**Constraints**:
- Reuse existing checkDevice() and network status functions
- Follow existing UI patterns for status indicators
- Maintain compatibility with existing POI IP management
- Handle connection failures gracefully
