---
id: task-37
title: "Phase 9: Run cordova prepare to propagate www/ changes to platforms"
column: todo
position: 18
description: After all Phases 1-8 are complete and all www/ source files are updated, run `cordova prepare` (or the equivalent build command) to propagate the www/ changes to the compiled platform directories (platforms/android/, platforms/electron/). The platforms are compiled outputs, not manually edited — they are regenerated from www/ via Cordova build tools. No manual file copying is needed.
priority: low
tags:
  - 8-poi
  - build
  - phase-9
createdAt: "2026-04-28T14:05:00.802Z"
updatedAt: "2026-04-28T14:20:26.340Z"
---

## Description
Sync all changes from www/ source files to platform-specific copies: platforms/android/app/src/main/assets/www/ and platforms/electron/www/. Files affected: index.html, controls.js, utils.js, network.js, state.js, main.js, images.js, upload.js, magic-bridge.js, text-tab.html, text-tab.js, styles.css. The platform files must be exact copies of the source www/ files to ensure consistency across Cordova build targets. Run cordova prepare after syncing if needed.
