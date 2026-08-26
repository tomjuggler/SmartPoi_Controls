// Smart Magic Bridge functionality - Multi-Timeline Edition
let abortControllers = [];

// Wrapper for fetch that adds abort controller
async function fetchWithAbort(url, options = {}) {
    const controller = new AbortController();
    abortControllers.push(controller);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    } catch (error) {
        throw error;
    } finally {
        const index = abortControllers.indexOf(controller);
        if (index > -1) abortControllers.splice(index, 1);
    }
}

// Fetch with timeout wrapper
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    abortControllers.push(controller);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    } finally {
        const index = abortControllers.indexOf(controller);
        if (index > -1) abortControllers.splice(index, 1);
    }
}

// ZIP data cache for the first timeline's preview data (TimelinePlayer)
const zipCache = {
    files: null,
    timingsArray: null,
    timelineData: null,
    binArrayBuffers: [],
    mp3BlobUrl: null,
    isLoaded: false
};

// Cancel ongoing uploads
function cancelUpload() {
    abortControllers.forEach(controller => controller.abort());
    abortControllers = [];
    const statusEl = document.getElementById('upload-status-standalone');
    if (statusEl) {
        statusEl.textContent = 'Upload cancelled';
        statusEl.style.color = 'orange';
    }
}

// Clear all timelines and reset
function clearUpload() {
    cancelUpload();
    state.magicBridge.timelines = [];
    zipCache.files = null;
    zipCache.timingsArray = null;
    zipCache.timelineData = null;
    zipCache.binArrayBuffers = [];
    zipCache.mp3BlobUrl = null;
    zipCache.isLoaded = false;
    if (typeof TimelinePlayer !== 'undefined' && typeof TimelinePlayer.reset === 'function') {
        TimelinePlayer.reset();
    }
    saveState();
    rebuildTimelineUI();
    const clearBtn = document.getElementById('magic-bridge-clear');
    if (clearBtn) clearBtn.style.display = 'none';
    const statusEl = document.getElementById('upload-status-standalone');
    if (statusEl) {
        statusEl.textContent = '';
        statusEl.style.color = 'inherit';
    }
}

// ============================
//     MULTI-TIMELINE UI
// ============================

function rebuildTimelineUI() {
    const container = document.getElementById('timeline-entries-container');
    if (!container) return;
    const timelines = state.magicBridge.timelines || [];
    container.innerHTML = '';

    timelines.forEach((tl, index) => {
        const card = document.createElement('div');
        card.className = 'timeline-entry-card' + (tl.files ? ' has-data' : '');
        card.dataset.timelineId = tl.id;

        // Header: title + status
        const header = document.createElement('div');
        header.className = 'timeline-entry-header';
        const titleSpan = document.createElement('span');
        titleSpan.className = 'timeline-entry-title';
        titleSpan.textContent = tl.title || `Timeline ${index + 1}`;
        header.appendChild(titleSpan);

        const statusSpan = document.createElement('span');
        statusSpan.className = 'timeline-entry-status';
        if (tl.uploaded) {
            statusSpan.textContent = 'Uploaded';
            statusSpan.classList.add('uploaded');
        } else if (tl.files && tl.files.length > 0) {
            statusSpan.textContent = 'Loaded (' + tl.files.length + ' files)';
            statusSpan.classList.add('loaded');
        } else {
            statusSpan.textContent = 'Not Loaded';
        }
        header.appendChild(statusSpan);
        card.appendChild(header);

        // Controls row
        const controls = document.createElement('div');
        controls.className = 'timeline-entry-controls';

        // ZIP file input area - shows different UI based on whether files are loaded
        if (tl.files && tl.files.length > 0) {
            // Already has files loaded - show "Choose another" option
            const fileLabel = document.createElement('span');
            fileLabel.className = 'tl-file-loaded-label';
            fileLabel.textContent = '\u2713 ' + tl.files.length + ' files loaded. ';
            controls.appendChild(fileLabel);

            const replaceInput = document.createElement('input');
            replaceInput.type = 'file';
            replaceInput.accept = '.zip';
            replaceInput.dataset.timelineId = tl.id;
            replaceInput.title = 'Choose another ZIP to replace current';
            if (tl.uploaded) replaceInput.disabled = true;
            replaceInput.addEventListener('change', function(e) {
                if (e.target.files && e.target.files[0]) {
                    handleTimelineZipSelected(tl.id);
                }
            });
            controls.appendChild(replaceInput);
        } else {
            // No files yet - show normal file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.zip';
            fileInput.dataset.timelineId = tl.id;
            fileInput.placeholder = 'Select ZIP...';
            if (tl.uploaded) fileInput.disabled = true;
            fileInput.addEventListener('change', function(e) {
                if (e.target.files && e.target.files[0]) {
                    handleTimelineZipSelected(tl.id);
                }
            });
            controls.appendChild(fileInput);
        }

        // POI checkboxes (multi-select)
        var poiLabel = document.createElement('label');
        poiLabel.className = 'tl-poi-label';
        poiLabel.textContent = 'Send to:';
        controls.appendChild(poiLabel);

        var poiCheckGroup = document.createElement('div');
        poiCheckGroup.className = 'tl-poi-checkgroup';

        var allPois = getPoiList();
        var selectedIPs = tl.assignedPoiIPs || [];

        allPois.forEach(function(poi) {
            if (!poi.ip || poi.ip === '0.0.0.0') return;
            var label = document.createElement('label');
            label.className = 'tl-poi-check-label';
            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = poi.ip;
            cb.checked = selectedIPs.indexOf(poi.ip) !== -1;
            if (tl.uploaded) cb.disabled = true;
            cb.addEventListener('change', function() {
                handlePoiToggle(tl.id, poi.ip, this.checked);
            });
            label.appendChild(cb);
            label.appendChild(document.createTextNode(' ' + poi.label));
            poiCheckGroup.appendChild(label);
        });

        controls.appendChild(poiCheckGroup);

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'timeline-remove-btn';
        removeBtn.textContent = 'Remove';
        if (tl.uploaded) removeBtn.disabled = true;
        removeBtn.addEventListener('click', function() {
            removeTimeline(tl.id);
        });
        controls.appendChild(removeBtn);

        // AP mode pairing note
        if (!state.poiIPs.routerMode) {
            var apNote = document.createElement('div');
            apNote.className = 'tl-ap-mode-note';
            apNote.textContent = 'AP mode: multi-timeline disabled. POIs are linked and share patterns.';
            controls.appendChild(apNote);
        }

        card.appendChild(controls);
        container.appendChild(card);
    });

    // Update Add Timeline button
    const addBtn = document.getElementById('add-timeline-btn');
    if (addBtn) {
        var isApMode = !state.poiIPs.routerMode;
        if (isApMode) {
            // In AP mode, allow one timeline, then disable for subsequent
            addBtn.disabled = timelines.length >= 1;
            addBtn.title = timelines.length >= 1
                ? 'Only one timeline allowed in AP mode'
                : 'Add a single timeline (AP mode)';
        } else {
            const availablePois = getAvailablePois();
            addBtn.disabled = availablePois.length === 0;
        }
    }

    // Update Clear All button
    const clearBtn = document.getElementById('magic-bridge-clear');
    if (clearBtn) {
        clearBtn.style.display = timelines.length > 0 ? 'inline-block' : 'none';
    }

    // Update Upload All button
    const uploadBtn = document.getElementById('magic-bridge-upload');
    if (uploadBtn) {
        const hasReadyTimelines = timelines.some(t => t.files && t.files.length > 0 && t.assignedPoiIPs && t.assignedPoiIPs.length > 0 && !t.uploaded);
        uploadBtn.disabled = !hasReadyTimelines;
    }
}

// ============================
//  MULTI-TIMELINE DATA HANDLING
// ============================

async function handleTimelineZipSelected(timelineId) {
    const timelines = state.magicBridge.timelines || [];
    const tl = timelines.find(t => t.id === timelineId);
    if (!tl) return;

    const statusEl = document.getElementById('upload-status-standalone');

    // Find the file input for this timeline
    const fileInput = document.querySelector(`input[type="file"][data-timeline-id="${timelineId}"]`);
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        if (statusEl) {
            statusEl.textContent = 'No file selected';
            statusEl.style.color = 'red';
        }
        return;
    }

    const file = fileInput.files[0];
    if (!file.name.toLowerCase().endsWith('.zip')) {
        if (statusEl) {
            statusEl.textContent = 'Please select a ZIP file';
            statusEl.style.color = 'red';
        }
        return;
    }

    if (statusEl) {
        statusEl.textContent = `Processing ZIP for ${tl.title || 'Timeline'}...`;
        statusEl.style.color = 'inherit';
    }

    try {
        const zip = await JSZip.loadAsync(file);

        // Parse images.json
        let timelineData = null;
        let imageOrder = null;
        let timingsArray = null;
        let binArrayBuffers = [];
        let mp3BlobUrl = null;

        try {
            const jsonFile = zip.file('images.json');
            if (jsonFile) {
                const jsonContent = await jsonFile.async('text');
                const jsonData = JSON.parse(jsonContent);
                timelineData = jsonData;
                if (jsonData.timeline_title) {
                    tl.title = jsonData.timeline_title;
                }
                if (jsonData.images_ordered && Array.isArray(jsonData.images_ordered)) {
                    imageOrder = jsonData.images_ordered.map(name => name.split('.')[0]);
                }
                if (jsonData.times && Array.isArray(jsonData.times)) {
                    timingsArray = jsonData.times;
                }
            }
        } catch (e) {
            console.warn('[MagicBridge] Failed to parse images.json:', e);
        }

        if (!timelineData) {
            if (statusEl) {
                statusEl.textContent = 'No images.json found in ZIP';
                statusEl.style.color = 'orange';
            }
            return;
        }

        // Get .bin files
        const binFiles = Object.values(zip.files).filter(f => {
            const fileName = f.name.split('/').pop().trim();
            return !f.dir && /\.bin$/i.test(fileName) && !f.name.includes('__MACOSX/');
        });

        let orderedBinFiles = [];
        if (imageOrder) {
            const fileMap = {};
            binFiles.forEach(f => {
                const fileName = f.name.split('/').pop().trim();
                const baseName = fileName.split('.')[0];
                fileMap[baseName] = f;
            });
            orderedBinFiles = imageOrder.map(baseName => fileMap[baseName]).filter(f => f !== null);
        } else {
            orderedBinFiles = binFiles.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Extract arraybuffers and create File objects
        const uploadFiles = (await Promise.all(orderedBinFiles.map(async (zf) => {
            try {
                const arrayBuffer = await zf.async('arraybuffer');
                if (arrayBuffer) binArrayBuffers.push(arrayBuffer);
            } catch (e) {
                console.warn('[MagicBridge] Failed to extract binary from', zf.name);
            }
            try {
                const blob = await zf.async('blob');
                const originalFileName = zf.name.split('/').pop().trim();
                return new File([blob], originalFileName, { type: 'application/octet-stream' });
            } catch (e) {
                console.warn('[MagicBridge] Failed to create blob from', zf.name, e);
                return null;
            }
        }))).filter(f => f !== null);

        if (uploadFiles.length === 0) {
            throw new Error('No .bin files found in ZIP archive');
        }

        // Extract audio
        try {
            const audioFile = Object.values(zip.files).find(f => {
                const name = f.name.split('/').pop().trim().toLowerCase();
                return !f.dir && (name.endsWith('.mp3') || name.endsWith('.aac') || name.endsWith('.wav'));
            });
            if (audioFile) {
                const audioBlob = await audioFile.async('blob');
                mp3BlobUrl = URL.createObjectURL(audioBlob);
            }
        } catch (e) {
            console.warn('[MagicBridge] No audio extracted');
        }

        // Store data in timeline entry
        tl.files = uploadFiles;
        tl.timingsArray = timingsArray;
        tl.timelineData = timelineData;
        tl.binArrayBuffers = binArrayBuffers;
        tl.audioUrl = mp3BlobUrl;
        tl.uploaded = false;

        // If this is the FIRST timeline, populate zipCache for TimelinePlayer
        const isFirstTimeline = timelines.indexOf(tl) === 0;
        if (isFirstTimeline) {
            zipCache.files = uploadFiles;
            zipCache.timingsArray = timingsArray;
            zipCache.timelineData = timelineData;
            zipCache.binArrayBuffers = binArrayBuffers;
            zipCache.mp3BlobUrl = mp3BlobUrl;
            zipCache.isLoaded = true;

            // Initialize TimelinePlayer for preview
            if (typeof TimelinePlayer !== 'undefined' && typeof TimelinePlayer.loadTimelineData === 'function') {
                try {
                    TimelinePlayer.setAudioUrl(mp3BlobUrl);
                    await TimelinePlayer.loadTimelineData(timelineData, binArrayBuffers);
                    console.log('[MagicBridge] TimelinePlayer initialized from timeline:', tl.id);
                    if (statusEl) {
                        statusEl.textContent = `Timeline ready: ${binArrayBuffers.length} images loaded.`;
                        statusEl.style.color = '#90c695';
                    }
                } catch (tlErr) {
                    console.error('[MagicBridge] TimelinePlayer init failed:', tlErr);
                    if (statusEl) {
                        statusEl.textContent = 'Timeline init failed: ' + tlErr.message;
                        statusEl.style.color = 'red';
                    }
                }
            }
        } else {
            if (statusEl) {
                statusEl.textContent = `${tl.title || 'Timeline'}: ${binArrayBuffers.length} images loaded.`;
                statusEl.style.color = '#90c695';
            }
        }

        // After any timeline is loaded/reloaded, update TimelinePlayer with ALL data
        updateTimelinePlayerState();
        saveState();
        rebuildTimelineUI();

    } catch (error) {
        console.error('[MagicBridge] ZIP processing failed:', error);
        if (statusEl) {
            statusEl.textContent = 'Failed to read ZIP: ' + error.message;
            statusEl.style.color = 'red';
        }
    }
}

// ============================
//   UPDATE TIMELINEPLAYER
// ============================

/**
 * Update TimelinePlayer with ALL timeline data for multi-timeline playback
 * Builds the full array of timeline objects and passes it to TimelinePlayer
 */
function updateTimelinePlayerState() {
    const timelines = state.magicBridge.timelines || [];
    if (timelines.length === 0 || typeof TimelinePlayer === 'undefined') return;

    // Build array of timeline objects for TimelinePlayer
    const tlDataArray = timelines.map(tl => ({
        times: tl.timingsArray || [],
        imagesOrdered: tl.timelineData ? tl.timelineData.images_ordered : [],
        timelineData: tl.timelineData,
        binArrayBuffers: tl.binArrayBuffers || [],
        title: tl.title || 'Timeline',
        assignedPoiIPs: tl.assignedPoiIPs || [],
        assignedPoiLabels: tl.assignedPoiLabels || []
    })).filter(tl => tl.times.length > 0 || tl.timelineData !== null);

    if (tlDataArray.length > 0 && typeof TimelinePlayer.loadTimelineData === 'function') {
        // Use first timeline's audio URL
        const firstTl = timelines[0];
        if (firstTl.audioUrl) {
            TimelinePlayer.setAudioUrl(firstTl.audioUrl);
        }
        TimelinePlayer.loadTimelineData(tlDataArray, timelines[0].binArrayBuffers || [])
            .catch(e => console.warn('[MagicBridge] TimelinePlayer update failed:', e));
    }
}

// ============================
//   MULTI-TIMELINE MANAGEMENT

function addTimeline() {
    const timelines = state.magicBridge.timelines || [];
    const availablePois = getAvailablePois();
    if (availablePois.length === 0) {
        const statusEl = document.getElementById('upload-status-standalone');
        if (statusEl) {
            statusEl.textContent = 'No available POIs to assign';
            statusEl.style.color = 'orange';
        }
        return;
    }
    const newId = 'tl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    timelines.push({
        id: newId,
        title: null,
        files: null,
        timingsArray: null,
        timelineData: null,
        binArrayBuffers: [],
        audioUrl: null,
        assignedPoiIPs: [],
        assignedPoiLabels: [],
        uploaded: false
    });
    saveState();
    rebuildTimelineUI();
    const container = document.getElementById('timeline-entries-container');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

function removeTimeline(timelineId) {
    const timelines = state.magicBridge.timelines || [];
    const index = timelines.findIndex(t => t.id === timelineId);
    if (index === -1) return;

    const removedTl = timelines[index];
    timelines.splice(index, 1);

    // If it was the first timeline, reset zipCache
    if (index === 0) {
        zipCache.files = null;
        zipCache.timingsArray = null;
        zipCache.timelineData = null;
        zipCache.binArrayBuffers = [];
        zipCache.mp3BlobUrl = null;
        zipCache.isLoaded = false;
        if (typeof TimelinePlayer !== 'undefined' && typeof TimelinePlayer.reset === 'function') {
            TimelinePlayer.reset();
        }
    }

    // Update TimelinePlayer with remaining timelines
    updateTimelinePlayerState();


    // Clean up audio URL
    if (removedTl.audioUrl) {
        URL.revokeObjectURL(removedTl.audioUrl);
    }

    saveState();
    rebuildTimelineUI();

    const statusEl = document.getElementById('upload-status-standalone');
    if (statusEl) {
        statusEl.textContent = 'Timeline removed';
        statusEl.style.color = 'inherit';
        setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 2000);
    }
}

function handlePoiToggle(timelineId, ip, checked) {
    const timelines = state.magicBridge.timelines || [];
    const tl = timelines.find(t => t.id === timelineId);
    if (!tl) return;
    if (!tl.assignedPoiIPs) tl.assignedPoiIPs = [];
    if (!tl.assignedPoiLabels) tl.assignedPoiLabels = [];
    if (checked) {
        if (tl.assignedPoiIPs.indexOf(ip) === -1) {
            tl.assignedPoiIPs.push(ip);
            tl.assignedPoiLabels.push(getPoiLabel(ip));
        }
    } else {
        const idx = tl.assignedPoiIPs.indexOf(ip);
        if (idx !== -1) {
            tl.assignedPoiIPs.splice(idx, 1);
            tl.assignedPoiLabels.splice(idx, 1);
        }
    }
    updateTimelinePlayerState();
    saveState();
    rebuildTimelineUI();
}

// ============================
//     MULTI-TIMELINE UPLOAD
// ============================

async function uploadAllTimelines() {
    const statusEl = document.getElementById('upload-status-standalone');
    const uploadBtn = document.getElementById('magic-bridge-upload');
    const timelines = state.magicBridge.timelines || [];

    const readyTimelines = timelines.filter(t => t.files && t.files.length > 0 && t.assignedPoiIPs && t.assignedPoiIPs.length > 0 && !t.uploaded);
    if (readyTimelines.length === 0) {
        if (statusEl) {
            statusEl.textContent = 'No timelines ready for upload. Load ZIP and assign POI first.';
            statusEl.style.color = 'orange';
        }
        return;
    }

    if (uploadBtn) uploadBtn.disabled = true;
    if (statusEl) {
        statusEl.textContent = 'Starting upload of ' + readyTimelines.length + ' timeline(s)...';
        statusEl.style.color = 'inherit';
    }

    let allSuccess = true;

    for (const tl of readyTimelines) {
        const ips = tl.assignedPoiIPs || [];
        const labels = tl.assignedPoiLabels || [];
        for (let pi = 0; pi < ips.length; pi++) {
            const ip = ips[pi];
            const label = labels[pi] || ip;
            if (statusEl) {
                statusEl.textContent = `Uploading to ${label}...`;
            }

            try {
                // Verify connectivity first
                let connected = false;
                try {
                    connected = await verifyPoiConnectionMB(ip);
                } catch (e) {
                    connected = false;
                }

                if (!connected) {
                    console.warn(`[MagicBridge] ${label} not reachable, skipping`);
                    if (statusEl) {
                        statusEl.textContent = `${label} not reachable, skipping...`;
                        statusEl.style.color = 'orange';
                    }
                    allSuccess = false;
                    continue;
                }

                // Upload timings first if available
                if (tl.timingsArray) {
                    const adjustedTimings = adjustTimingsArray(tl.timingsArray, tl.files.length);
                    try {
                        await uploadTimingsToPoi(adjustedTimings, ip, label);
                    } catch (e) {
                        console.warn(`[MagicBridge] Timings upload to ${label} failed, continuing:`, e);
                    }
                }

                // Upload .bin files
                await uploadToPoiWithProgress(tl.files, ip, label);

                if (statusEl) {
                    statusEl.textContent = `${label}: ${tl.files.length} files uploaded successfully.`;
                    statusEl.style.color = 'green';
                }

            } catch (error) {
                console.error(`[MagicBridge] Upload failed for ${label}:`, error);
                if (statusEl) {
                    statusEl.textContent = `Upload failed for ${label}: ${error.message}`;
                    statusEl.style.color = 'red';
                }
                allSuccess = false;
            }
        }
        tl.uploaded = true;
    }

    saveState();
    rebuildTimelineUI();

    if (uploadBtn) uploadBtn.disabled = false;

    if (allSuccess && statusEl) {
        statusEl.textContent = 'All timelines uploaded successfully!';
        statusEl.style.color = 'green';
    }
}

// ============================
//     POI CONNECTIVITY
// ============================

async function verifyPoiConnectionMB(ip) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    abortControllers.push(controller);

    try {
        await fetch(`http://${ip}/edit`, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal
        });
        return true;
    } catch (error) {
        try {
            await fetch(`http://${ip}/get-pixels`, {
                method: 'GET',
                mode: 'no-cors',
                signal: controller.signal
            });
            return true;
        } catch (e) {
            return new Promise(resolve => {
                const img = new Image();
                img.onerror = () => resolve(true);
                img.onabort = () => resolve(false);
                setTimeout(() => resolve(false), 2000);
                img.src = `http://${ip}/favicon.ico?t=${Date.now()}`;
            });
        }
    } finally {
        clearTimeout(timeoutId);
        const index = abortControllers.indexOf(controller);
        if (index > -1) abortControllers.splice(index, 1);
    }
}

// ============================
//       UPLOAD HELPERS
// ============================

async function uploadToPoiWithProgress(files, ip, label) {
    const statusEl = document.getElementById('upload-status-standalone');
    const config = state.magicBridge.CONFIG;

    try {
        const batchCount = Math.ceil(files.length / config.BATCH_SIZE);

        for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
            const batchStart = batchIndex * config.BATCH_SIZE;
            const batchFiles = files.slice(batchStart, batchStart + config.BATCH_SIZE);

            if (statusEl) {
                statusEl.textContent = `Uploading to ${label}: Batch ${batchIndex + 1}/${batchCount}`;
            }

            for (let fileIndex = 0; fileIndex < batchFiles.length; fileIndex++) {
                const file = batchFiles[fileIndex];
                const targetName = generateUploadBinFilename(batchStart + fileIndex);
                const formData = new FormData();
                formData.append('file', file, targetName);

                await fetchWithAbort(`http://${ip}/edit`, {
                    method: 'POST',
                    body: formData
                });
                await delay(config.INTER_FILE_DELAY);
            }

            if (batchIndex < batchCount - 1) {
                await delay(config.INTER_BATCH_DELAY);
            }
        }

        return true;
    } catch (error) {
        console.error('POI Upload Failure:', {
            ip,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

async function uploadTimingsToPoi(timingsArray, ip, label) {
    const statusEl = document.getElementById('upload-status-standalone');
    if (!timingsArray || !Array.isArray(timingsArray)) {
        console.log('No timings array provided, skipping timings upload');
        return;
    }

    try {
        if (statusEl) {
            statusEl.textContent = `Uploading timings to ${label}...`;
        }

        const jsonBody = JSON.stringify(timingsArray);
        const response = await fetchWithAbort(`http://${ip}/timings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `body=${encodeURIComponent(jsonBody)}`
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.includes('text/html') || contentType.includes('text/plain')) {
            console.warn(`Timings endpoint on ${label} returned non-JSON response (likely not supported by this POI firmware)`);
            if (statusEl) {
                statusEl.textContent = `Timings skipped for ${label} (endpoint may not support timings)`;
            }
            return;
        }

        const result = await response.json();
        console.log('Timings upload result:', result);
        if (statusEl) {
            statusEl.textContent = `Timings uploaded to ${label} successfully`;
        }
    } catch (error) {
        console.error(`Failed to upload timings to ${label}:`, error);
        if (statusEl) {
            statusEl.textContent = `Timings upload to ${label} failed: ${error.message}`;
        }
    }
}

function adjustTimingsArray(timingsArray, targetLength) {
    if (timingsArray.length === targetLength) {
        return timingsArray;
    }

    if (timingsArray.length > targetLength) {
        return timingsArray.slice(0, targetLength);
    }

    const result = [...timingsArray];
    const lastTiming = result[result.length - 1];
    let lastInterval = result.length >= 2 ? lastTiming - result[result.length - 2] : 1000;

    while (result.length < targetLength) {
        result.push(lastTiming + lastInterval * (result.length - timingsArray.length + 1));
    }
    return result;
}

// ============================
//      EVENT LISTENERS
// ============================

function setupMagicBridgeListeners() {
    const addBtn = document.getElementById('add-timeline-btn');
    if (addBtn) {
        addBtn.addEventListener('click', addTimeline);
    }

    const uploadBtn = document.getElementById('magic-bridge-upload');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', uploadAllTimelines);
    }

    const clearBtn = document.getElementById('magic-bridge-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearUpload);
}

// Listeners are set up by main.js to avoid duplication. Keep setupMagicBridgeListeners
// available for manual invocation if needed.

// Initial UI build on load
if (typeof state !== 'undefined' && state.magicBridge && state.magicBridge.timelines) {
    setTimeout(rebuildTimelineUI, 200);
}
}

// ============================
//     BRIGHTNESS ON PLAY
// ============================

const MB_BRIGHTNESS_ENABLED_KEY = 'mbBrightnessEnabled';
const MB_BRIGHTNESS_VALUE_KEY = 'mbBrightnessValue';
const MB_BRIGHTNESS_MIN = 20;
const MB_BRIGHTNESS_MAX = 255;
const MB_BRIGHTNESS_DEFAULT = 255;

/**
 * Read the persisted brightness-on-play settings (Enable checkbox + slider value).
 * Remembered across sessions via localStorage. Defaults: OFF / 255.
 */
function getMagicBridgeBrightnessSetting() {
    var enabled = false;
    var value = MB_BRIGHTNESS_DEFAULT;
    try {
        enabled = localStorage.getItem(MB_BRIGHTNESS_ENABLED_KEY) === 'true';
        var stored = parseInt(localStorage.getItem(MB_BRIGHTNESS_VALUE_KEY), 10);
        if (!isNaN(stored)) {
            value = Math.min(MB_BRIGHTNESS_MAX, Math.max(MB_BRIGHTNESS_MIN, stored));
        }
    } catch (e) {
        console.warn('[MagicBridge] Failed to read brightness settings:', e);
    }
    return { enabled: enabled, value: value };
}

/**
 * Send the brightness command to every configured POI.
 * Uses the same endpoint as the Controls tab: /brightness?brt=<value>
 * @param {number} brightness - 20-255
 * @returns {number} number of POIs the command was sent to
 */
function sendBrightnessToConfiguredPois(brightness) {
    var ips = [];
    if (typeof getPoiList === 'function') {
        getPoiList().forEach(function (poi) {
            if (poi.ip && poi.ip !== '0.0.0.0' && ips.indexOf(poi.ip) === -1) {
                ips.push(poi.ip);
            }
        });
    }
    ips.forEach(function (ip) {
        fetch(`http://${ip}/brightness?brt=${brightness}`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        }).then(function () {
            console.log(`[MagicBridge] ✓ brightness=${brightness} applied on ${ip}`);
        }).catch(function (err) {
            console.warn(`[MagicBridge] ✗ brightness=${brightness} failed on ${ip}:`, err.message);
        });
    });
    return ips.length;
}

/**
 * Called by TimelinePlayer whenever Play starts.
 * Sends the saved brightness to all configured POIs if the feature is enabled.
 */
window.sendBrightnessOnPlay = function () {
    var setting = getMagicBridgeBrightnessSetting();
    if (!setting.enabled) return;
    var count = sendBrightnessToConfiguredPois(setting.value);
    console.log(`[MagicBridge] Brightness ${setting.value} sent to ${count} POI(s) on Play`);
};

/**
 * Wire up the Enable checkbox + Brightness slider in the playback section
 * and restore their persisted values.
 */
function initMagicBridgeBrightnessControls() {
    const checkbox = document.getElementById('mb-brightness-enable');
    const slider = document.getElementById('mb-brightness-slider');
    const valueEl = document.getElementById('mb-brightness-value');
    if (!checkbox || !slider || !valueEl) return;

    const setting = getMagicBridgeBrightnessSetting();
    checkbox.checked = setting.enabled;
    slider.value = setting.value;
    valueEl.textContent = setting.value;
    slider.disabled = !setting.enabled;

    checkbox.addEventListener('change', function () {
        try {
            localStorage.setItem(MB_BRIGHTNESS_ENABLED_KEY, checkbox.checked ? 'true' : 'false');
        } catch (e) {
            console.warn('[MagicBridge] Failed to save brightness enabled flag:', e);
        }
        slider.disabled = !checkbox.checked;
    });

    slider.addEventListener('input', function () {
        const value = parseInt(slider.value, 10);
        valueEl.textContent = value;
        try {
            localStorage.setItem(MB_BRIGHTNESS_VALUE_KEY, String(value));
        } catch (e) {
            console.warn('[MagicBridge] Failed to save brightness value:', e);
        }
    });
}

// Wire up brightness-on-play controls once the DOM is available
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMagicBridgeBrightnessControls);
} else {
    initMagicBridgeBrightnessControls();
}
