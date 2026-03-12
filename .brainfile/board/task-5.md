---
id: task-5
title: "TEXT-006: Integrate with existing POI upload infrastructure"
column: todo
position: 5
description: |-
  Connect text image generation to existing POI upload pipeline

  **Objective**: Integrate canvas-to-File conversion with existing upload.js and image-processing.js

  **Key Requirements**:
  1. Call handleImageUpload() with converted File object
  2. Pass selected filename and target POI IP
  3. Handle pattern switching during upload
  4. Implement progress feedback
  5. Manage upload success/error states

  **Constraints**:
  - Reuse existing handleImageUpload() function
  - Follow existing error handling patterns
  - Maintain POI connection state
  - Preserve existing upload retry logic
priority: high
tags:
  - integration
  - upload
  - api
  - error-handling
createdAt: "2026-03-12T09:26:38.305Z"
contract:
  status: ready
  deliverables:
    - type: file
      path: www/text-upload-integration.js
    - type: test
      path: .brainfile/tests/upload-integration-test.html
    - type: docs
      path: .brainfile/docs/TEXT-006-integration-guide.md
  validation:
    commands:
      - grep -n 'handleImageUpload' www/text-upload-integration.js
      - node -c www/text-upload-integration.js
      - test -f .brainfile/tests/upload-integration-test.html
  constraints:
    - No modifications to handleImageUpload()
    - Must use existing createMessage() for feedback
    - Follow existing upload state management
---

## Description
Connect text image generation to existing POI upload pipeline

**Objective**: Integrate canvas-to-File conversion with existing upload.js and image-processing.js

**Key Requirements**:
1. Call handleImageUpload() with converted File object
2. Pass selected filename and target POI IP
3. Handle pattern switching during upload
4. Implement progress feedback
5. Manage upload success/error states

**Constraints**:
- Reuse existing handleImageUpload() function
- Follow existing error handling patterns
- Maintain POI connection state
- Preserve existing upload retry logic
