/**
 * Timeline Player Module
 * Handles timeline playback for Smart Magic Bridge
 * Decompresses .bin files for local preview and sends pattern commands to POIs
 */
const TimelinePlayer = (function() {
    'use strict';

    // Module state
    const _state = {
        // Timeline data from images.json
        timelineId: null,
        timelineTitle: null,
        imagesOrdered: [],
        times: [],
        mp3Filename: null,
        mp3Duration: 0,
        
        // Raw .bin binary data for preview (array of ArrayBuffer/Uint8Array)
        binFiles: [],
        decompressedPreviews: [], // Array of data URLs for preview
        
        // Playback state
        isPlaying: false,
        isPaused: false,
        startTime: 0,
        pausedTime: 0,
        currentTime: 0,
        currentIndex: -1,
        animationFrameId: null,
        
        // Audio
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
        status: () => document.getElementById('tl-status')
    };

    /**
     * Initialize the module
     */
    function init() {
        cacheElements();
        setupEventListeners();
        
        // Show the timeline section framework immediately (visible whenever tab is active)
        const section = E.section();
        if (section) {
            section.style.display = 'block';
            // Show placeholder if no data loaded yet
            if (!_state.times || _state.times.length === 0) {
                showStatus('Load a timeline ZIP above and click "Upload to POI" to start', 'info');
            }
        }
        
        // Check POI connectivity
        checkPoiConnectivity();
        
        console.log('TimelinePlayer initialized');
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
     * Called from magic-bridge.js after ZIP is processed
     */
    async function loadTimelineData(timelineData, binFilesArray) {
        console.log('[TimelinePlayer] loadTimelineData called - images_ordered:', timelineData?.images_ordered?.length, 'times:', timelineData?.times?.length, 'binFiles:', binFilesArray?.length);
        _state.timelineId = timelineData.timeline_id || null;
        _state.timelineTitle = timelineData.timeline_title || 'Untitled Timeline';
        _state.imagesOrdered = timelineData.images_ordered || [];
        _state.times = timelineData.times || [];
        _state.mp3Filename = timelineData.mp3_filename || null;
        _state.mp3Duration = timelineData.mp3_duration || 0;
        _state.binFiles = binFilesArray || [];
        _state.decompressedImages = [];

        // Reset playback state
        stop();
        _state.currentTime = 0;
        _state.currentIndex = -1;

        if (_state.imagesOrdered.length === 0 || _state.times.length === 0) {
            showStatus('No timeline data found in ZIP', 'warning');
            return;
        }

        // Update UI info
        const titleEl = E.title();
        const durationEl = E.duration();
        if (titleEl) titleEl.textContent = _state.timelineTitle || `Timeline #${_state.timelineId}`;
        
        const totalDuration = _state.times.length > 0 ? _state.times[_state.times.length - 1] : 0;
        if (durationEl) durationEl.textContent = ` | Duration: ${formatTime(totalDuration)}`;

        // Show the timeline section
        const section = E.section();
        if (section) section.style.display = 'block';

        showStatus(`Loaded ${_state.imagesOrdered.length} images, decompressing...`, 'info');

        // Decompress .bin files for preview
        await decompressAllImages();

        // Build the image strip
        buildImageStrip();

        // Setup time markers
        setupTimeMarkers();

        // Setup audio if mp3 is available
        if (_state.mp3Filename && _state.audioUrl) {
            setupAudio();
        }

        // Check POI connectivity
        checkPoiConnectivity();

        showStatus(`Timeline ready - ${_state.imagesOrdered.length} images`, 'info');
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
     * Decompress all .bin files using Jimp for preview
     */
    /**
     * Decompress all .bin files using the SAME format as image-processing.js
     * Uses canvas-based rendering (no Jimp dependency needed for preview)
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
                console.error('Failed to decompress image', i, err);
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
     * Build the image strip in the timeline
     */
    /**
     * Build the image strip showing previews of all timeline frames
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
     * Setup time markers below the progress bar
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

        // Start audio if available
        const audioEl = E.audio();
        if (audioEl && _state.audioUrl) {
            audioEl.currentTime = _state.currentTime / 1000;
            audioEl.play().catch(e => console.log('Audio play failed:', e));
        }

        // Send the current frame to POIs immediately when playback starts
        if (_state.currentIndex >= 0) {
            sendPatternToPOIs(_state.currentIndex);
        } else {
            // First frame - send immediately
            const startIndex = findIndexForTime(_state.currentTime);
            if (startIndex >= 0) {
                _state.currentIndex = startIndex;
                sendPatternToPOIs(startIndex);
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
        _state.decompressedImages = [];
        _state.decompressedPreviews = [];
        _state.pausedTime = 0;
        _state.audioUrl = null;
        _state.totalDuration = 0;
        
        // Clear image strip
        const strip = E.imageStrip();
        if (strip) strip.innerHTML = '';
        
        // Clear time markers
        const markers = E.timeMarkers();
        if (markers) markers.innerHTML = '';
        
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

        // Send the pattern command for this frame
        if (_state.currentIndex >= 0) {
            sendPatternToPOIs(_state.currentIndex);
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
        // before we finish playback
        const effectiveTime = Math.min(_state.currentTime, totalDuration);

        // Check if we need to advance to the next image (BEFORE completion check,
        // so the last frame's pattern is sent before playback finishes)
        const newIndex = findIndexForTime(effectiveTime);
        if (newIndex !== _state.currentIndex && newIndex >= 0) {
            _state.currentIndex = newIndex;
            sendPatternToPOIs(newIndex);
            highlightCurrentFrame(newIndex);
        }

        // Check if playback is complete (after sending last pattern)
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

    // ========== POI Communication ==========

    /**
     * Send pattern command to all connected POIs
     * Uses the established /pattern?patternChooserChange=${index} endpoint
     */
    // Rate limiter: prevent sending the same pattern more than once per interval
    const _lastSendTime = {}; // { 'pattern_ip': timestamp }
    const SEND_COOLDOWN = 800; // ms - minimum gap between sends of same pattern to same POI
    
    function sendPatternToPOIs(index) {
        const pattern = index + 8; // Pattern 8 = a.bin (index 0), 9 = b.bin (index 1), etc. Matches Image Management
        
        // Get all connected POI IPs
        const ips = getConnectedPoiIPs();
        
        if (ips.length === 0) {
            console.log('[TimelinePlayer] No POIs connected, skipping pattern send');
            updatePoiStatus('offline', 'No POIs connected');
            return;
        }
        
        // Rate limit check: skip if we already sent this pattern to these IPs recently
        const now = Date.now();
        let allSkipped = true;
        for (const ip of ips) {
            const key = `${pattern}_${ip}`;
            const lastTime = _lastSendTime[key] || 0;
            if (now - lastTime >= SEND_COOLDOWN) {
                allSkipped = false;
                break;
            }
        }
        if (allSkipped) {
            console.log(`[TimelinePlayer] ⏱ Skipping pattern ${pattern} (all IPs on cooldown, ${SEND_COOLDOWN}ms)`);
            return;
        }
        
        // Mark all IPs as sent IMMEDIATELY (before any async work) to prevent duplicate sends
        for (const ip of ips) {
            _lastSendTime[`${pattern}_${ip}`] = now;
        }
        
        console.log(`[TimelinePlayer] Sending pattern ${pattern} (image index ${index}) to ${ips.length} POI(s):`, ips);
        
        let successCount = 0;
        const totalIps = ips.length;
        
        // Send simultaneously to all POIs for sync
        Promise.all(ips.map(async (ip) => {
            const url = `http://${ip}/pattern?patternChooserChange=${pattern}`;
            console.log(`[TimelinePlayer] → GET ${url}`);
            
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000) // 5 second timeout
                });
                console.log(`[TimelinePlayer] ✓ ${ip} responded: ${response.status}`);
                successCount++;
                if (successCount === totalIps) {
                    updatePoiStatus('online', `${totalIps} POI(s) synced (pattern ${pattern})`);
                }
            } catch (err) {
                console.log(`[TimelinePlayer] ✗ ${ip} failed:`, err.message);
            }
        }));
        
        updatePoiStatus('online', `Sending pattern ${pattern} to ${totalIps} POI(s)...`);
    }

    /**
     * Get all connected POI IP addresses
     */
    function getConnectedPoiIPs() {
        if (typeof getPoiIPs === 'function') {
            return getPoiIPs().filter(ip => ip && ip !== '0.0.0.0');
        }
        // Fallback: try to get IPs from global state
        if (typeof state !== 'undefined' && state.poiIPs) {
            const ips = [];
            if (state.poiIPs.mainIP && state.poiIPs.mainIP !== '0.0.0.0') ips.push(state.poiIPs.mainIP);
            if (state.poiIPs.auxIP && state.poiIPs.auxIP !== '0.0.0.0') ips.push(state.poiIPs.auxIP);
            return ips;
        }
        return [];
    }

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
        reset: reset
    };
})();

// Make globally available
window.TimelinePlayer = TimelinePlayer;