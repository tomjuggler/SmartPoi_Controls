/**
 * Timeline Player Module - Multi-Timeline Edition
 * Handles timeline playback for Smart Magic Bridge
 * Decompresses .bin files for local preview and sends pattern commands to assigned POIs
 * Supports MULTIPLE timelines each targeting a different POI
 */
const TimelinePlayer = (function() {
    'use strict';

    // Module state
    const _state = {
        // Array of ALL timeline data objects
        allTimelines: [],

        // First timeline data (drives transport: audio, image strip, time markers, duration)
        timelineId: null,
        timelineTitle: null,
        imagesOrdered: [],
        times: [],
        mp3Filename: null,
        mp3Duration: 0,

        // Raw .bin binary data for preview (array of ArrayBuffer/Uint8Array) - from first timeline
        binFiles: [],
        decompressedPreviews: [], // Array of data URLs for preview

        // Playback state
        isPlaying: false,
        isPaused: false,
        startTime: 0,
        pausedTime: 0,
        currentTime: 0,
        currentIndex: -1,
        lastTimelineFrames: [], // Tracks last sent frame index per timeline for independent POI timing
        animationFrameId: null,

        // Audio (from first timeline only)
        audioElement: null,
        audioUrl: null,

        // Elements (cached)
        els: {}
    };

    // DOM Elements
    const E = {
        section: () => document.getElementById('timeline-player-section'),
        title: () => document.getElementById('timeline-title'),
        duration: () => document.getElementById('timeline-duration'),
        imageStrip: () => document.getElementById('timeline-images-strip'),
        playBtn: () => document.getElementById('tl-play'),
        pauseBtn: () => document.getElementById('tl-pause'),
        restartBtn: () => document.getElementById('tl-restart'),
        timeDisplay: () => document.getElementById('tl-time'),
        progressTrack: () => document.getElementById('tl-progress-track'),
        progressFill: () => document.getElementById('tl-progress-fill'),
        progressThumb: () => document.getElementById('tl-progress-thumb'),
        progressContainer: () => document.getElementById('tl-progress-container'),
        timeMarkers: () => document.getElementById('tl-time-markers'),
        audio: () => document.getElementById('tl-audio'),
        poiStatus: () => document.getElementById('tl-poi-status'),
        status: () => document.getElementById('tl-status'),
        multiTimelineStatus: () => document.getElementById('multi-timeline-status'),
        multiTimelineAssignments: () => document.getElementById('multi-timeline-assignments')
    };

    /**
     * Initialize the module
     */
    function init() {
        cacheElements();
        setupEventListeners();

        // Show the timeline section framework immediately
        const section = E.section();
        if (section) {
            section.style.display = 'block';
            if (!_state.times || _state.times.length === 0) {
                showStatus('Load timeline ZIPs and click play to start', 'info');
            }
        }

        // Check POI connectivity for all assigned POIs
        checkPoiConnectivity();

        console.log('[TimelinePlayer] Initialized (Multi-Timeline Edition)');
    }

    function cacheElements() {
        // Elements are accessed via E closures
    }

    function setupEventListeners() {
        const playBtn = E.playBtn();
        const pauseBtn = E.pauseBtn();
        const restartBtn = E.restartBtn();
        const progressContainer = E.progressContainer();

        if (playBtn) playBtn.addEventListener('click', play);
        if (pauseBtn) pauseBtn.addEventListener('click', pause);
        if (restartBtn) restartBtn.addEventListener('click', restart);

        // Seekable progress bar - click to seek
        if (progressContainer) {
            progressContainer.addEventListener('mousedown', handleSeekStart);
            progressContainer.addEventListener('touchstart', handleSeekStartTouch, { passive: false });
        }
    }

    /**
     * Load timeline data from processed ZIP
     * Now takes an ARRAY of timeline data objects for multi-timeline support
     * Called from magic-bridge.js after ZIPs are processed
     * @param {Array} timelinesArray - Array of { times, imagesOrdered, binFiles, assignedPoiIP, assignedPoiLabel, title }
     * @param {Array} binFilesArray - (Legacy) binary files for first timeline
     */
    async function loadTimelineData(timelinesArray, binFilesArray) {
        console.log('[TimelinePlayer] loadTimelineData called - timelines:', timelinesArray?.length);

        // Reset first timeline data
        _state.timelineId = null;
        _state.timelineTitle = null;
        _state.imagesOrdered = [];
        _state.times = [];
        _state.mp3Filename = null;
        _state.mp3Duration = 0;
        _state.binFiles = binFilesArray || [];
        _state.decompressedPreviews = [];

        // Normalize input: if a single object (not array) is passed, wrap it as first timeline
        if (!Array.isArray(timelinesArray) && timelinesArray && typeof timelinesArray === 'object') {
            timelinesArray = [{
                times: timelinesArray.times || [],
                imagesOrdered: timelinesArray.images_ordered || timelinesArray.imagesOrdered || [],
                timelineData: timelinesArray,
                binArrayBuffers: binFilesArray || [],
                title: timelinesArray.timeline_title || 'Timeline',
                assignedPoiIPs: [],
                assignedPoiLabels: []
            }];
        }

        // Store all timelines
        _state.allTimelines = timelinesArray || [];

        // Reset per-timeline frame tracker to match the new timeline count
        _state.lastTimelineFrames = new Array(_state.allTimelines.length).fill(-1);

        // Use the FIRST timeline to drive transport (audio, image strip, duration)
        const firstTl = Array.isArray(timelinesArray) && timelinesArray.length > 0 ? timelinesArray[0] : null;

        if (firstTl && firstTl.timelineData) {
            const data = firstTl.timelineData;
            _state.timelineId = data.timeline_id || null;
            _state.timelineTitle = data.timeline_title || firstTl.title || 'Untitled Timeline';
            _state.imagesOrdered = data.images_ordered || [];
            _state.times = data.times || [];
            _state.mp3Filename = data.mp3_filename || null;
            _state.mp3Duration = data.mp3_duration || 0;
            _state.binFiles = firstTl.binArrayBuffers || binFilesArray || [];
        } else if (firstTl && firstTl.times) {
            // Direct properties (already extracted)
            _state.timelineTitle = firstTl.title || 'Untitled Timeline';
            _state.imagesOrdered = firstTl.imagesOrdered || [];
            _state.times = firstTl.times || [];
            _state.binFiles = firstTl.binFiles || binFilesArray || [];
        }

        // Reset playback state
        stop();
        _state.currentTime = 0;
        _state.currentIndex = -1;

        if (_state.imagesOrdered.length === 0 || _state.times.length === 0) {
            showStatus('No timeline data found in first timeline', 'warning');
            return;
        }

        // Update UI info
        const titleEl = E.title();
        const durationEl = E.duration();
        if (titleEl) titleEl.textContent = _state.timelineTitle || `Timeline`;

        const totalDuration = _state.times.length > 0 ? _state.times[_state.times.length - 1] : 0;
        if (durationEl) durationEl.textContent = ` | Duration: ${formatTime(totalDuration)}`;

        // Show the timeline section
        const section = E.section();
        if (section) section.style.display = 'block';

        showStatus(`Loaded ${_state.imagesOrdered.length} images, decompressing...`, 'info');

        // Decompress .bin files for preview
        await decompressAllImages();

        // Build the image strip (from first timeline)
        buildImageStrip();

        // Setup time markers (from first timeline)
        setupTimeMarkers();

        // Setup audio if mp3 is available (from first timeline)
        if (_state.mp3Filename && _state.audioUrl) {
            setupAudio();
        }

        // Update multi-timeline assignments display
        updateMultiTimelineAssignments();

        // Check POI connectivity for all assigned POIs
        checkPoiConnectivity();

        showStatus(`Timeline ready - ${_state.imagesOrdered.length} images. ${_state.allTimelines.length} timeline(s) loaded for playback.`, 'info');
    }

    /**
     * Set the audio blob URL from the extracted mp3
     */
    function setAudioUrl(blobUrl) {
        _state.audioUrl = blobUrl;
    }

    function setupAudio() {
        const audioEl = E.audio();
        if (!audioEl || !_state.audioUrl) return;
        audioEl.src = _state.audioUrl;
        audioEl.load();
    }

    /**
     * Decompress all .bin files using canvas-based rendering
     */
    async function decompressAllImages() {
        _state.decompressedPreviews = [];

        for (let i = 0; i < _state.binFiles.length; i++) {
            try {
                const data = new Uint8Array(_state.binFiles[i]);
                const width = getPixelWidth();
                const height = Math.ceil(data.length / width);

                // Create canvas and decode pixels matching the POI format
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                const imageData = ctx.createImageData(width, height);

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const dataIndex = y * width + x;
                        if (dataIndex < data.length) {
                            const encodedValue = data[dataIndex];
                            const pixelIndex = (y * width + x) * 4;
                            // Match decompress() in image-processing.js:
                            // R = bits 7-5 (3 bits), G = bits 4-2 (3 bits), B = bits 1-0 (2 bits)
                            const r = ((encodedValue & 0xE0) >> 5) << 3;
                            const g = ((encodedValue & 0x1C) >> 2) << 3;
                            const b = (encodedValue & 0x03) << 6;
                            imageData.data[pixelIndex] = r;
                            imageData.data[pixelIndex + 1] = g;
                            imageData.data[pixelIndex + 2] = b;
                            imageData.data[pixelIndex + 3] = 255;
                        }
                    }
                }
                ctx.putImageData(imageData, 0, 0);

                _state.decompressedPreviews.push(canvas.toDataURL());
            } catch (err) {
                console.error('[TimelinePlayer] Failed to decompress image', i, err);
                _state.decompressedPreviews.push(null);
            }
        }
    }

    /**
     * Get the pixel width from global state
     */
    function getPixelWidth() {
        if (typeof state !== 'undefined' && state.settings && state.settings.pixels) {
            return state.settings.pixels;
        }
        return 60; // Default fallback
    }

    /**
     * Build the image strip showing previews of all timeline frames (from first timeline)
     */
    function buildImageStrip() {
        const strip = E.imageStrip();
        if (!strip) return;
        strip.innerHTML = '';

        _state.imagesOrdered.forEach((name, index) => {
            const item = document.createElement('div');
            item.className = 'timeline-frame';
            item.dataset.index = index;
            item.title = `${name} @ ${formatTimeShort(_state.times[index] || 0)}`;

            const dataUrl = _state.decompressedPreviews[index];
            if (dataUrl) {
                const imgEl = document.createElement('img');
                imgEl.className = 'timeline-frame-img';
                imgEl.src = dataUrl;
                item.appendChild(imgEl);
            } else {
                item.textContent = (name || '?').substring(0, 6);
                item.style.cssText = 'display:flex;align-items:center;justify-content:center;color:#666;font-size:10px;';
            }

            // Click to seek to this frame
            item.addEventListener('click', () => {
                const time = _state.times[index] || 0;
                seekTo(time);
            });

            strip.appendChild(item);
        });
    }

    /**
     * Setup time markers below the progress bar (from first timeline)
     */
    function setupTimeMarkers() {
        const container = E.timeMarkers();
        if (!container) return;
        container.innerHTML = '';

        if (_state.times.length < 2) return;

        const totalDuration = _state.times[_state.times.length - 1];
        if (totalDuration === 0) return;

        // Show markers for each timing point
        _state.times.forEach((time, index) => {
            const marker = document.createElement('span');
            marker.className = 'tl-marker';
            marker.style.left = `${(time / totalDuration) * 100}%`;
            marker.textContent = formatTimeShort(time);
            marker.dataset.index = index;
            marker.addEventListener('click', () => seekTo(time));
            container.appendChild(marker);
        });
    }

    /**
     * Update the multi-timeline assignments display
     */
    function updateMultiTimelineAssignments() {
        const container = E.multiTimelineAssignments();
        if (!container) return;
        container.innerHTML = '';

        const timelines = _state.allTimelines || [];
        if (timelines.length === 0) return;

        timelines.forEach((tl, index) => {
            var labels = tl.assignedPoiLabels || [tl.assignedPoiLabel].filter(Boolean);
            var ips = tl.assignedPoiIPs || [tl.assignedPoiIP].filter(Boolean);
            const title = tl.title || `Timeline ${index + 1}`;
            var displayText = labels.length > 0 ? labels.join(', ') : (ips.length > 0 ? ips.join(', ') : 'Not assigned');

            const item = document.createElement('div');
            item.className = 'timeline-assignment-item';
            item.innerHTML = '<span class="tl-assign-title">' + title + '</span> <span class="tl-assign-poi">→ ' + displayText + '</span>';
            container.appendChild(item);
        });
    }

    // ========== Playback Controls ==========

    function play() {
        if (_state.isPlaying) return;

        if (_state.times.length === 0) {
            showStatus('No timeline data loaded', 'warning');
            return;
        }

        _state.isPlaying = true;
        _state.isPaused = false;

        const playBtn = E.playBtn();
        const pauseBtn = E.pauseBtn();
        if (playBtn) playBtn.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'inline-block';

        // If at the end, restart
        if (_state.currentTime >= getTotalDuration()) {
            _state.currentTime = 0;
            _state.currentIndex = -1;
        }

        // Start audio if available (first timeline)
        const audioEl = E.audio();
        if (audioEl && _state.audioUrl) {
            audioEl.currentTime = _state.currentTime / 1000;
            audioEl.play().catch(e => console.log('[TimelinePlayer] Audio play failed:', e));
        }

        // Reset per-timeline frame tracker so each timeline sends its initial frame
        // Clear stale rate limiter data so this play session starts fresh
        Object.keys(_lastSendTime).forEach(function(k) {
            delete _lastSendTime[k];
        });
        _state.lastTimelineFrames = new Array((_state.allTimelines || []).length).fill(-1);

        // Send the current frame for ALL timelines to their assigned POIs immediately
        if (_state.currentIndex >= 0) {
            // Send current pattern for each timeline to its assigned POI
            sendPatternsForAllTimelines(_state.currentIndex);
        } else {
            // First frame - find index and send
            const startIndex = findIndexForTime(_state.currentTime);
            if (startIndex >= 0) {
                _state.currentIndex = startIndex;
                sendPatternsForAllTimelines(startIndex);
                highlightCurrentFrame(startIndex);
            }
        }

        _state.startTime = performance.now() - _state.currentTime;
        _state.animationFrameId = requestAnimationFrame(updatePlayback);

        showStatus('Playing...', 'info');
    }

    function pause() {
        if (!_state.isPlaying) return;

        _state.isPlaying = false;
        _state.isPaused = true;
        _state.pausedTime = _state.currentTime;

        if (_state.animationFrameId) {
            cancelAnimationFrame(_state.animationFrameId);
            _state.animationFrameId = null;
        }

        const playBtn = E.playBtn();
        const pauseBtn = E.pauseBtn();
        if (playBtn) playBtn.style.display = 'inline-block';
        if (pauseBtn) pauseBtn.style.display = 'none';

        // Pause audio
        const audioEl = E.audio();
        if (audioEl) audioEl.pause();

        showStatus('Paused', 'info');
    }

    function stop() {
        _state.isPlaying = false;
        _state.isPaused = false;
        _state.pausedTime = 0;

        if (_state.animationFrameId) {
            cancelAnimationFrame(_state.animationFrameId);
            _state.animationFrameId = null;
        }

        const playBtn = E.playBtn();
        const pauseBtn = E.pauseBtn();
        if (playBtn) playBtn.style.display = 'inline-block';
        if (pauseBtn) pauseBtn.style.display = 'none';

        // Stop audio
        const audioEl = E.audio();
        if (audioEl) {
            audioEl.pause();
            audioEl.currentTime = 0;
        }
    }

    function reset() {
        stop();
        _state.currentTime = 0;
        _state.currentIndex = -1;
        _state.timelineId = null;
        _state.timelineTitle = null;
        _state.imagesOrdered = [];
        _state.times = [];
        _state.mp3Filename = null;
        _state.mp3Duration = 0;
        _state.binFiles = [];
        _state.decompressedPreviews = [];
        _state.pausedTime = 0;
        _state.audioUrl = null;
        _state.totalDuration = 0;
        _state.allTimelines = [];
        _state.lastTimelineFrames = [];

        // Clear rate limiter state so stale cooldown data doesn't persist across sessions
        Object.keys(_lastSendTime).forEach(function(k) {
            delete _lastSendTime[k];
        });

        // Clear image strip
        const strip = E.imageStrip();
        if (strip) strip.innerHTML = '';

        // Clear time markers
        const markers = E.timeMarkers();
        if (markers) markers.innerHTML = '';

        // Clear multi-timeline assignments
        const assignments = E.multiTimelineAssignments();
        if (assignments) assignments.innerHTML = '';

        // Clear multi-timeline status
        const multiStatus = E.multiTimelineStatus();
        if (multiStatus) multiStatus.innerHTML = '';

        // Reset time display
        const timeEl = E.timeDisplay();
        if (timeEl) timeEl.textContent = '00:00.000';

        // Reset progress
        const fill = E.progressFill();
        if (fill) fill.style.width = '0%';
        const thumb = E.progressThumb();
        if (thumb) thumb.style.left = '0%';

        // Reset title and duration
        const titleEl = E.title();
        if (titleEl) titleEl.textContent = '';
        const durEl = E.duration();
        if (durEl) durEl.textContent = '';

        // Revoke audio URL if set
        const audioEl = E.audio();
        if (audioEl) {
            audioEl.pause();
            audioEl.src = '';
            audioEl.load();
        }

        showStatus('Timeline cleared', 'info');
        updatePoiStatus('offline', 'Not connected');
    }

    function restart() {
        stop();
        _state.currentTime = 0;
        _state.currentIndex = -1;
        updateUI();
        play();
    }

    function seekTo(timeMs) {
        const totalDuration = getTotalDuration();
        timeMs = Math.max(0, Math.min(timeMs, totalDuration));

        const wasPlaying = _state.isPlaying;
        if (wasPlaying) {
            if (_state.animationFrameId) {
                cancelAnimationFrame(_state.animationFrameId);
                _state.animationFrameId = null;
            }
        }

        _state.currentTime = timeMs;
        _state.startTime = performance.now() - timeMs;

        // Find the current image index
        updateCurrentIndex();

        // Update audio
        const audioEl = E.audio();
        if (audioEl && _state.audioUrl) {
            audioEl.currentTime = timeMs / 1000;
        }

        // Reset per-timeline frame tracker so seek sends the correct frames
        _state.lastTimelineFrames = new Array((_state.allTimelines || []).length).fill(-1);

        // Send the pattern for this frame to ALL timelines' assigned POIs
        if (_state.currentIndex >= 0) {
            sendPatternsForAllTimelines(_state.currentIndex);
        }

        updateUI();

        if (wasPlaying) {
            _state.animationFrameId = requestAnimationFrame(updatePlayback);
        }
    }

    // ========== Playback Update Loop ==========

    function updatePlayback(timestamp) {
        if (!_state.isPlaying) return;

        _state.currentTime = timestamp - _state.startTime;
        const totalDuration = getTotalDuration();

        // Cap at totalDuration so findIndexForTime can locate the last frame
        const effectiveTime = Math.min(_state.currentTime, totalDuration);

        // PER-TIMELINE frame check - each timeline advances independently
        // Only send pattern commands to POIs whose timeline frame has changed
        const timelines = _state.allTimelines || [];
        timelines.forEach((tl, tlIdx) => {
            var ips = tl.assignedPoiIPs || [tl.assignedPoiIP].filter(Boolean);
            if (ips.length === 0) return;

            const tlFrame = findTimelineFrameIndex(tl, effectiveTime);
            const lastFrame = _state.lastTimelineFrames[tlIdx];
            if (tlFrame >= 0 && tlFrame !== lastFrame) {
                _state.lastTimelineFrames[tlIdx] = tlFrame;
                var pattern = tlFrame + 8;
                var tlName = tl.title || 'Timeline ' + (tlIdx + 1);
                var ipList = ips.join(', ');
                console.log('[TimelinePlayer] ▶ ' + tlName + ' frame#' + tlFrame + ' → pattern ' + pattern + ' to [' + ipList + '] @ ' + Math.round(effectiveTime) + 'ms');
                ips.forEach(function(ip) {
                    sendPatternToPOI(pattern, ip);
                });
            }
        });

        // First timeline index for UI highlighting (image strip)
        const newIndex = findIndexForTime(effectiveTime);
        if (newIndex !== _state.currentIndex && newIndex >= 0) {
            _state.currentIndex = newIndex;
            highlightCurrentFrame(newIndex);
        }

        // Check if playback is complete
        if (_state.currentTime >= totalDuration) {
            _state.currentTime = totalDuration;
            updateUI();
            finishPlayback();
            return;
        }

        // Sync audio time
        const audioEl = E.audio();
        if (audioEl && _state.audioUrl && !audioEl.paused) {
            // Let audio drive timing if it's playing
            _state.currentTime = audioEl.currentTime * 1000;
        }

        updateUI();
        _state.animationFrameId = requestAnimationFrame(updatePlayback);
    }

    function finishPlayback() {
        _state.isPlaying = false;
        _state.isPaused = false;

        if (_state.animationFrameId) {
            cancelAnimationFrame(_state.animationFrameId);
            _state.animationFrameId = null;
        }

        const playBtn = E.playBtn();
        const pauseBtn = E.pauseBtn();
        if (playBtn) playBtn.style.display = 'inline-block';
        if (pauseBtn) pauseBtn.style.display = 'none';

        showStatus('Playback complete', 'info');
    }

    // ========== Multi-Timeline POI Communication ==========

    /**
     * Send pattern command to ALL timelines' assigned POIs
     * Each timeline sends its current frame pattern to its assigned POI only
     * @param {number} index - The frame index in the first timeline (used to find per-timeline frames)
     */
    function sendPatternsForAllTimelines(index) {
        const timelines = _state.allTimelines || [];
        if (timelines.length === 0) {
            console.log('[TimelinePlayer] No timelines loaded, skipping pattern send');
            updatePoiStatus('offline', 'No timelines loaded');
            return;
        }

        let sentCount = 0;

        timelines.forEach((tl, tlIdx) => {
            var ips = tl.assignedPoiIPs || [tl.assignedPoiIP].filter(Boolean);
            if (ips.length === 0) {
                console.log('[TimelinePlayer] ' + (tl.title || 'Timeline') + ' has no assigned POI, skipping');
                return;
            }

            // Find the correct frame index for THIS timeline's times array
            const tlIndex = findTimelineFrameIndex(tl, _state.currentTime);
            if (tlIndex < 0) return;

            var pattern = tlIndex + 8;
            var tlName = tl.title || 'Timeline ' + (tlIdx + 1);
            var ipList = ips.join(', ');
            console.log('[TimelinePlayer] ▶ ' + tlName + ' INIT frame#' + tlIndex + ' → pattern ' + pattern + ' to [' + ipList + '] @ ' + Math.round(_state.currentTime) + 'ms');
            ips.forEach(function(ip) {
                sendPatternToPOI(pattern, ip);
                sentCount++;
            });

            // Track this frame as last sent for this timeline
            _state.lastTimelineFrames[tlIdx] = tlIndex;
        });

        if (sentCount > 0) {
            updatePoiStatus('online', `Sending to ${sentCount} POI(s)`);
        }

        // Update multi-timeline status display
        updateMultiTimelineStatus();
    }

    /**
     * Find the frame index for a specific timeline at a given time
     * Uses the timeline's own timings array
     * @param {Object} tl - Timeline object with its times array
     * @param {number} timeMs - Current time in milliseconds
     * @returns {number} - Frame index or -1 if not found
     */
    function findTimelineFrameIndex(tl, timeMs) {
        const times = tl.times || [];
        if (times.length === 0) return 0; // No timing info, assume frame 0

        let index = -1;
        for (let i = 0; i < times.length; i++) {
            if (times[i] <= timeMs) {
                index = i;
            } else {
                break;
            }
        }
        return index;
    }

    /**
     * Send pattern command to ONE specific POI
     * @param {number} pattern - Pattern number (index + 8)
     * @param {string} ip - Target POI IP address
     */
    // Rate limiter: prevent sending the same pattern more than once per interval
    const _lastSendTime = {}; // { 'pattern_ip': timestamp }
    const SEND_COOLDOWN = 800; // ms - minimum gap between sends of same pattern to same POI

    function sendPatternToPOI(pattern, ip) {
        if (!ip || ip === '0.0.0.0') return;

        // Rate limit check
        const now = Date.now();
        const key = `${pattern}_${ip}`;
        const lastTime = _lastSendTime[key] || 0;
        if (now - lastTime < SEND_COOLDOWN) {
            console.log(`[TimelinePlayer] ⏱ Skipping pattern ${pattern} to ${ip} (cooldown)`);
            return;
        }
        _lastSendTime[key] = now;

        const timeMs = Math.round(_state.currentTime);
        console.log(`[TimelinePlayer] SENDING pattern=${pattern} to IP=${ip} at time=${timeMs}ms`);

        const url = `http://${ip}/pattern?patternChooserChange=${pattern}`;
        fetch(url, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        }).then(response => {
            console.log(`[TimelinePlayer] ✓ ${ip} responded: ${response.status}`);
        }).catch(err => {
            console.log(`[TimelinePlayer] ✗ ${ip} failed:`, err.message);
        });
    }

    /**
     * Get all connected POI IP addresses from all timelines
     */
    function getConnectedPoiIPs() {
        const timelines = _state.allTimelines || [];
        const ips = new Set();
        timelines.forEach(function(tl) {
            (tl.assignedPoiIPs || []).forEach(function(ip) {
                if (ip && ip !== '0.0.0.0') ips.add(ip);
            });
        });

        if (ips.size > 0) {
            return Array.from(ips);
        }

        // Fallback: try to get IPs from global state
        if (typeof state !== 'undefined' && state.poiIPs) {
            const fallbackIps = [];
            if (state.poiIPs.mainIP && state.poiIPs.mainIP !== '0.0.0.0') fallbackIps.push(state.poiIPs.mainIP);
            if (state.poiIPs.auxIP && state.poiIPs.auxIP !== '0.0.0.0') fallbackIps.push(state.poiIPs.auxIP);
            return fallbackIps;
        }
        return [];
    }

    /**
     * Check connectivity of all assigned POIs
     */
    async function checkPoiConnectivity() {
        const ips = getConnectedPoiIPs();
        if (ips.length === 0) {
            updatePoiStatus('offline', 'No POIs configured');
            return;
        }

        let connectedCount = 0;
        const results = await Promise.allSettled(ips.map(ip =>
            fetch(`http://${ip}/get-pixels`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            })
        ));

        results.forEach(r => {
            if (r.status === 'fulfilled' && r.value.ok) connectedCount++;
        });

        if (connectedCount === ips.length) {
            updatePoiStatus('online', `${connectedCount}/${ips.length} POIs connected`);
        } else if (connectedCount > 0) {
            updatePoiStatus('online', `${connectedCount}/${ips.length} POIs connected`);
        } else {
            updatePoiStatus('offline', 'No POIs reachable');
        }
    }

    function updatePoiStatus(className, message) {
        const el = E.poiStatus();
        if (!el) return;
        el.innerHTML = `POI Status: <span class="status-dot ${className}"></span> ${message}`;
    }

    // ========== Multi-Timeline Status Display ==========

    /**
     * Update the multi-timeline status div with per-timeline info
     */
    function updateMultiTimelineStatus() {
        const container = E.multiTimelineStatus();
        if (!container) return;
        container.innerHTML = '';

        const timelines = _state.allTimelines || [];
        if (timelines.length === 0) {
            container.innerHTML = '<div style="color:#888;">No timelines loaded</div>';
            return;
        }

        timelines.forEach((tl) => {
            var ips = tl.assignedPoiIPs || [tl.assignedPoiIP].filter(Boolean);
            var labels = tl.assignedPoiLabels || [tl.assignedPoiLabel].filter(Boolean);
            var displayLabel = labels.length > 0 ? labels.join(', ') : (ips.length > 0 ? ips.join(', ') : 'Not assigned');
            var hasPoi = ips.length > 0;
            const title = tl.title || 'Timeline';

            // Find current frame for this timeline
            const frameIndex = findTimelineFrameIndex(tl, _state.currentTime);
            const pattern = frameIndex >= 0 ? frameIndex + 8 : '-';

            const item = document.createElement('div');
            item.className = 'tl-status-item';
            if (_state.isPlaying) {
                item.classList.add('active-send');
            }

            var statusIcon = hasPoi ? '🟢' : '⚪';
            item.innerHTML = '<span class="tl-status-poi">' + statusIcon + ' ' + title + ' → ' + displayLabel + '</span> <span class="tl-status-pattern">Pattern ' + pattern + '</span>';
            container.appendChild(item);
        });
    }

    // ========== UI Update ==========

    function updateUI() {
        // Update time display
        const timeEl = E.timeDisplay();
        if (timeEl) timeEl.textContent = formatTime(_state.currentTime);

        // Update progress bar
        const totalDuration = getTotalDuration();
        const progress = totalDuration > 0 ? (_state.currentTime / totalDuration) * 100 : 0;

        const fill = E.progressFill();
        const thumb = E.progressThumb();
        if (fill) fill.style.width = `${Math.min(progress, 100)}%`;
        if (thumb) thumb.style.left = `${Math.min(progress, 100)}%`;

        // Update current image index
        updateCurrentIndex();
        highlightCurrentFrame(_state.currentIndex);

        // Update multi-timeline status
        updateMultiTimelineStatus();
    }

    function updateCurrentIndex() {
        _state.currentIndex = findIndexForTime(_state.currentTime);
    }

    function findIndexForTime(timeMs) {
        if (!_state.times || _state.times.length === 0) return -1;

        // Find the last timing point that is <= current time
        let index = -1;
        for (let i = 0; i < _state.times.length; i++) {
            if (_state.times[i] <= timeMs) {
                index = i;
            } else {
                break;
            }
        }
        return index;
    }

    function highlightCurrentFrame(index) {
        const strip = E.imageStrip();
        if (!strip) return;

        strip.querySelectorAll('.timeline-frame').forEach(el => {
            el.classList.toggle('active', parseInt(el.dataset.index) === index);
        });
    }

    function getTotalDuration() {
        if (_state.times.length > 0) {
            return _state.times[_state.times.length - 1];
        }
        if (_state.mp3Duration > 0) {
            return _state.mp3Duration;
        }
        return 0;
    }

    /**
     * Get POI label from a global function or state
     */
    function getPoiLabel(ip) {
        if (!ip) return 'Unknown';
        // Try the global getPoiLabel function first
        if (typeof window.getPoiLabel === 'function') {
            return window.getPoiLabel(ip);
        }
        // Fallback: check state
        if (typeof state !== 'undefined' && state.poiIPs) {
            const ipMap = {
                [state.poiIPs.mainIP]: 'Main POI',
                [state.poiIPs.auxIP]: 'Aux POI',
                [state.poiIPs.poiThreeIP]: 'POI 3',
                [state.poiIPs.poiFourIP]: 'POI 4',
                [state.poiIPs.poiFiveIP]: 'POI 5',
                [state.poiIPs.poiSixIP]: 'POI 6',
                [state.poiIPs.poiSevenIP]: 'POI 7',
                [state.poiIPs.poiEightIP]: 'POI 8'
            };
            return ipMap[ip] || `POI (${ip})`;
        }
        return `POI (${ip})`;
    }

    /**
     * Get all timeline configurations
     */
    function getTimelines() {
        return _state.allTimelines;
    }

    // ========== Progress Bar Seeking ==========

    let isSeeking = false;

    function handleSeekStart(e) {
        isSeeking = true;
        doSeek(e.clientX);

        const onMove = (ev) => {
            if (isSeeking) doSeek(ev.clientX);
        };
        const onUp = () => {
            isSeeking = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    function handleSeekStartTouch(e) {
        e.preventDefault();
        isSeeking = true;
        doSeek(e.touches[0].clientX);

        const onMove = (ev) => {
            if (isSeeking) doSeek(ev.touches[0].clientX);
        };
        const onEnd = () => {
            isSeeking = false;
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        };

        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }

    function doSeek(clientX) {
        const container = E.progressContainer();
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const totalDuration = getTotalDuration();
        const timeMs = ratio * totalDuration;

        seekTo(timeMs);
    }

    // ========== Utility ==========

    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const millis = Math.floor(ms % 1000);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
    }

    function formatTimeShort(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    function showStatus(message, type = 'info') {
        const el = E.status();
        if (!el) return;
        el.textContent = message;
        el.className = `upload-status ${type}`;
    }

    // ========== Public API ==========

    return {
        init: init,
        loadTimelineData: loadTimelineData,
        setAudioUrl: setAudioUrl,
        play: play,
        pause: pause,
        restart: restart,
        seekTo: seekTo,
        isPlaying: () => _state.isPlaying,
        getCurrentTime: () => _state.currentTime,
        getTotalDuration: getTotalDuration,
        reset: reset,
        getTimelines: getTimelines
    };
})();

// Make globally available
window.TimelinePlayer = TimelinePlayer;