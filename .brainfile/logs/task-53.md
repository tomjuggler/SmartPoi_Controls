---
id: task-53
title: Redesign TimelinePlayer for multi-timeline playback with targeted POI routing
description: Upgrade TimelinePlayer to handle multiple timelines. Each timeline has its own assigned POI IP. Playback uses first timeline's audio and total duration. When sending patterns during playback, each timeline's messages go to its assigned POI only. Playback is independent of upload status.
priority: high
tags:
  - timeline-player
  - playback
createdAt: "2026-07-29T08:36:41.792Z"
updatedAt: "2026-07-29T09:03:39.059Z"
completedAt: "2026-07-30T10:05:52.536Z"
---

## Description
Upgrade TimelinePlayer to handle multiple timelines. Each timeline has its own assigned POI IP. Playback uses first timeline's audio and total duration. When sending patterns during playback, each timeline's messages go to its assigned POI only. Playback is independent of upload status.
