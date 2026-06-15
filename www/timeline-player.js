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

        // Check if playback is complete
        if (_state.currentTime >= totalDuration) {
            _state.currentTime = totalDuration;
            updateUI();
            finishPlayback();
            return;
        }

        // Check if we need to advance to the next image
        const newIndex = findIndexForTime(_state.currentTime);
        if (newIndex !== _state.currentIndex && newIndex >= 0) {
            _state.currentIndex = newIndex;
            sendPatternToPOIs(newIndex);
            highlightCurrentFrame(newIndex);
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
    function sendPatternToPOIs(index) {
        const pattern = index; // Use image index as pattern number
        
        // Get all connected POI IPs
        const ips = getConnectedPoiIPs();
        
        if (ips.length === 0) {
            updatePoiStatus('offline', 'No POIs connected');
            return;
        }

        let successCount = 0;
        ips.forEach(ip => {
            fetch(`http://${ip}/pattern?patternChooserChange=${pattern}`, {
                method: 'GET',
                signal: AbortSignal.timeout(1000)
            })
            .then(() => {
                successCount++;
                if (successCount === ips.length) {
                    updatePoiStatus('online', `${ips.length} POI(s) synced`);
                }
            })
            .catch(err => {
                console.log(`Pattern send to ${ip} failed:`, err.message);
            });
        });

        updatePoiStatus('online', `Sending image ${index} to ${ips.length} POI(s)`);
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
        getTotalDuration: getTotalDuration
    };
})();

// Make globally available
window.TimelinePlayer = TimelinePlayer;