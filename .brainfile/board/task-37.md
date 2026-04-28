---
id: task-37
title: "Phase 9: Duplicate changes to platform builds (android + electron)"
column: todo
position: 18
description: "Sync all changes from www/ source files to platform-specific copies: platforms/android/app/src/main/assets/www/ and platforms/electron/www/. Files affected: index.html, controls.js, utils.js, network.js, state.js, main.js, images.js, upload.js, magic-bridge.js, text-tab.html, text-tab.js, styles.css. The platform files must be exact copies of the source www/ files to ensure consistency across Cordova build targets. Run cordova prepare after syncing if needed."
priority: medium
tags:
  - 8-poi
  - platform-sync
  - phase-9
createdAt: "2026-04-28T14:05:00.802Z"
---

## Description
Sync all changes from www/ source files to platform-specific copies: platforms/android/app/src/main/assets/www/ and platforms/electron/www/. Files affected: index.html, controls.js, utils.js, network.js, state.js, main.js, images.js, upload.js, magic-bridge.js, text-tab.html, text-tab.js, styles.css. The platform files must be exact copies of the source www/ files to ensure consistency across Cordova build targets. Run cordova prepare after syncing if needed.
