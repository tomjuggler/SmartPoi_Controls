// Smart Magic Bridge functionality
let uploadInProgress = false;
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
        // Remove controller from array once request completes
        const index = abortControllers.indexOf(controller);
        if (index > -1) abortControllers.splice(index, 1);
    }
}
// ZIP data cache - stores extracted data separately from upload
const zipCache = {
    files: null,         // File[] - upload-ready .bin files
    timingsArray: null,   // number[] - timing data from images.json
    timelineData: null,   // object - full images.json content
    binArrayBuffers: [], // ArrayBuffer[] - raw binary data for TimelinePlayer
    mp3BlobUrl: null,    // string|null - audio blob URL
    isLoaded: false      // boolean - whether cache contains valid data
};

// Cancel ongoing upload
function cancelUpload() {
    abortControllers.forEach(controller => controller.abort());
    abortControllers = [];
    uploadInProgress = false;
    const fileInput = document.getElementById('zip-input');
    fileInput.disabled = false;
    const uploadBtn = document.getElementById('magic-bridge-upload');
    uploadBtn.textContent = 'Try again';
    uploadBtn.disabled = false;
    const statusEl = document.getElementById('upload-status-standalone');
    statusEl.textContent = 'Upload cancelled';
    statusEl.style.color = 'orange';
}

// Clear file selection and reset UI
function clearUpload() {
    cancelUpload(); // Cancel any ongoing upload first
    const fileInput = document.getElementById('zip-input');
    fileInput.value = '';
    fileInput.disabled = false;
    document.getElementById('file-list').style.display = 'none';
    const statusEl = document.getElementById('upload-status-standalone');
    statusEl.textContent = '';
    const uploadBtn = document.getElementById('magic-bridge-upload');
    uploadBtn.textContent = 'Upload to POI';
    const clearBtn = document.getElementById('magic-bridge-clear');
    clearBtn.style.display = 'none';
    uploadInProgress = false;
    // Clear ZIP data cache
    zipCache.files = null;
    zipCache.timingsArray = null;
    zipCache.timelineData = null;
    zipCache.binArrayBuffers = [];
    zipCache.mp3BlobUrl = null;
    zipCache.isLoaded = false;
    // Reset TimelinePlayer
    if (typeof TimelinePlayer !== 'undefined' && typeof TimelinePlayer.reset === 'function') {
        TimelinePlayer.reset();
    }
}
// Handle upload button click - toggle between start/cancel
function toggleMagicBridgeUpload() {
    if (uploadInProgress) {
        cancelUpload();
    } else {
        processAndUploadZip();
    }
}
async function processAndUploadZip() {
    const fileInput = document.getElementById('zip-input');
    const statusEl = document.getElementById('upload-status-standalone');
    const uploadBtn = document.getElementById('magic-bridge-upload');
    
    if (!fileInput.files[0]) {
        statusEl.textContent = 'Please select a ZIP file first';
        statusEl.style.color = 'red';
        return;
    }

    if (uploadInProgress) {
        // Already uploading, should not happen because button text changed
        return;
    }
    uploadInProgress = true;
    fileInput.disabled = true;
    const clearBtn = document.getElementById('magic-bridge-clear');
    clearBtn.style.display = 'inline-block';
    uploadBtn.textContent = 'Cancel';

    uploadBtn.disabled = true;
    statusEl.textContent = 'Preparing upload...';
    statusEl.style.color = 'inherit';
    let uploadSuccess = false;
    
    try {
        // Use cached data if available (populated by previewTimelineFromZip on file selection)
        let files = zipCache.files;
        let timingsArray = zipCache.timingsArray;
        
        // If cache is empty, extract from ZIP as fallback
        if (!zipCache.isLoaded || !files || files.length === 0) {
            console.log('[MagicBridge] Cache empty, extracting from ZIP for upload');
            statusEl.textContent = 'Processing ZIP file...';
            
            const zip = await JSZip.loadAsync(fileInput.files[0]);
            
            // Parse images.json
            let imageOrder = null;
            timingsArray = null;
            let timelineData = null;
            
            try {
                const jsonFile = zip.file("images.json");
                if (jsonFile) {
                    const jsonContent = await jsonFile.async('text');
                    const jsonData = JSON.parse(jsonContent);
                    timelineData = jsonData;
                    if (jsonData.images_ordered && Array.isArray(jsonData.images_ordered)) {
                        imageOrder = jsonData.images_ordered.map(name => name.split('.')[0]);
                    }
                    if (jsonData.times && Array.isArray(jsonData.times)) {
                        timingsArray = jsonData.times;
                    }
                }
            } catch (error) {
                console.error('Error parsing images.json:', error);
            }
            
            // Get all .bin files from the ZIP
            const binFiles = Object.values(zip.files).filter(file => {
                const fileName = file.name.split('/').pop().trim();
                const hasBinExtension = /\.bin$/i.test(fileName);
                return !file.dir && hasBinExtension && !file.name.includes('__MACOSX/');
            });
            
            let orderedBinFiles = [];
            if (imageOrder) {
                const fileMap = {};
                binFiles.forEach(file => {
                    const fileName = file.name.split('/').pop().trim();
                    const baseName = fileName.split('.')[0];
                    fileMap[baseName] = file;
                });
                orderedBinFiles = imageOrder.map(baseName => fileMap[baseName]).filter(f => f !== null);
            } else {
                orderedBinFiles = binFiles.sort((a, b) => a.name.localeCompare(b.name));
            }
            
            // Create File objects AND capture raw binary data for TimelinePlayer
            const binArrayBuffers = [];
            files = (await Promise.all(
                orderedBinFiles.map(async (file) => {
                    try {
                        const arrayBuffer = await file.async('arraybuffer');
                        if (arrayBuffer) binArrayBuffers.push(arrayBuffer);
                    } catch (e) {
                        console.warn('[MagicBridge] Failed to extract binary data from', file.name);
                    }
                    try {
                        const blob = await file.async('blob');
                        const originalFileName = file.name.split('/').pop().trim();
                        return new File([blob], originalFileName, {
                            type: 'application/octet-stream'
                        });
                    } catch (e) {
                        console.warn('[MagicBridge] Failed to create blob from', file.name, e);
                        return null;
                    }
                })
            )).filter(f => f !== null);
            
            // Extract audio
            let mp3BlobUrl = null;
            try {
                const audioFile = Object.values(zip.files).find(f => {
                    const name = f.name.split('/').pop().trim().toLowerCase();
                    return !f.dir && (name.endsWith('.mp3') || name.endsWith('.aac') || name.endsWith('.wav'));
                });
                if (audioFile) {
                    const audioBlob = await audioFile.async('blob');
                    mp3BlobUrl = URL.createObjectURL(audioBlob);
                    console.log('[MagicBridge] Audio file extracted:', audioFile.name);
                }
            } catch (e) {
                console.warn('[MagicBridge] No audio extracted');
            }
            
            // Populate cache for future use
            zipCache.files = files;
            zipCache.timingsArray = timingsArray;
            zipCache.timelineData = timelineData;
            zipCache.binArrayBuffers = binArrayBuffers;
            zipCache.mp3BlobUrl = mp3BlobUrl;
            zipCache.isLoaded = true;
            
            // Initialize TimelinePlayer immediately (before upload)
            if (timelineData && typeof TimelinePlayer !== 'undefined' && typeof TimelinePlayer.loadTimelineData === 'function') {
                try {
                    TimelinePlayer.setAudioUrl(mp3BlobUrl);
                    await TimelinePlayer.loadTimelineData(timelineData, binArrayBuffers);
                    console.log('[MagicBridge] TimelinePlayer initialized from fallback extraction');
                } catch (tlErr) {
                    console.error('[MagicBridge] TimelinePlayer fallback init failed:', tlErr);
                }
            }
        }
        
        if (files.length === 0) {
            throw new Error('No .bin files found in ZIP archive');
        }
        
        // Show file list
        document.getElementById('file-list').style.display = 'block';
        document.getElementById('file-names').innerHTML = files
            .map(f => `<li>${f.name}</li>`)
            .join('');
        
        // Proceed with upload only
        statusEl.textContent = 'Checking POI connectivity...';
        
        let mainAvailable = false;
        let auxAvailable = false;
        let threeAvailable = false;
        let fourAvailable = false;
        let fiveAvailable = false;
        let sixAvailable = false;
        let sevenAvailable = false;
        let eightAvailable = false;

        // Connectivity check - skip unconfigured IPs (0.0.0.0)
        const isConfigured = (ip) => ip && ip !== '0.0.0.0';
        
        const connectivityChecks = [
            { ip: state.poiIPs.mainIP, setter: (v) => { mainAvailable = v; }, label: 'Main' },
            { ip: state.poiIPs.auxIP, setter: (v) => { auxAvailable = v; }, label: 'Aux' },
            { ip: state.poiIPs.poiThreeIP, setter: (v) => { threeAvailable = v; }, label: 'POI 3' },
            { ip: state.poiIPs.poiFourIP, setter: (v) => { fourAvailable = v; }, label: 'POI 4' },
            { ip: state.poiIPs.poiFiveIP, setter: (v) => { fiveAvailable = v; }, label: 'POI 5' },
            { ip: state.poiIPs.poiSixIP, setter: (v) => { sixAvailable = v; }, label: 'POI 6' },
            { ip: state.poiIPs.poiSevenIP, setter: (v) => { sevenAvailable = v; }, label: 'POI 7' },
            { ip: state.poiIPs.poiEightIP, setter: (v) => { eightAvailable = v; }, label: 'POI 8' }
        ];
        
        await Promise.all(connectivityChecks.map(async (check) => {
            if (isConfigured(check.ip)) {
                try {
                    const result = await verifyPoiConnectionMB(check.ip);
                    check.setter(result);
                } catch (e) {
                    console.log(`${check.label} (${check.ip}) connectivity check failed`);
                    check.setter(false);
                }
            } else {
                check.setter(false);
            }
        }));
        
        if (!mainAvailable && !auxAvailable && !threeAvailable && !fourAvailable && !fiveAvailable && !sixAvailable && !sevenAvailable && !eightAvailable) {
            throw new Error("No POIs available for upload");
        }

        statusEl.textContent = `Uploading ${files.length} files...`;
        
        // Upload timings if available (before images)
        if (timingsArray) {
            // Warn if timings array length doesn't match number of images
            if (timingsArray.length !== files.length) {
                console.warn(`Timings array length (${timingsArray.length}) doesn't match number of images (${files.length}), adjusting...`);
                timingsArray = adjustTimingsArray(timingsArray, files.length);
            }
            const timingPromises = [];
            if (mainAvailable) {
                timingPromises.push(uploadTimingsToPoi(timingsArray, state.poiIPs.mainIP, 'Main POI'));
            }
            if (auxAvailable) {
                timingPromises.push(uploadTimingsToPoi(timingsArray, state.poiIPs.auxIP, 'Aux POI'));
            }
            if (threeAvailable) {
                timingPromises.push(uploadTimingsToPoi(timingsArray, state.poiIPs.poiThreeIP, 'POI 3'));
            }
            if (fourAvailable) {
                timingPromises.push(uploadTimingsToPoi(timingsArray, state.poiIPs.poiFourIP, 'POI 4'));
            }
            if (fiveAvailable) {
                timingPromises.push(uploadTimingsToPoi(timingsArray, state.poiIPs.poiFiveIP, 'POI 5'));
            }
            if (sixAvailable) {
                timingPromises.push(uploadTimingsToPoi(timingsArray, state.poiIPs.poiSixIP, 'POI 6'));
            }
            if (sevenAvailable) {
                timingPromises.push(uploadTimingsToPoi(timingsArray, state.poiIPs.poiSevenIP, 'POI 7'));
            }
            if (eightAvailable) {
                timingPromises.push(uploadTimingsToPoi(timingsArray, state.poiIPs.poiEightIP, 'POI 8'));
            }
            await Promise.allSettled(timingPromises); // Don't let timings failure break the flow
        }

        statusEl.textContent = `Uploading ${files.length} files...`;
        
        // Upload images to available POIs
        const uploadPromises = [];
        if (mainAvailable) {
            uploadPromises.push(uploadToPoiWithProgress(files, state.poiIPs.mainIP, 'Main POI'));
        }
        if (auxAvailable) {
            uploadPromises.push(uploadToPoiWithProgress(files, state.poiIPs.auxIP, 'Aux POI'));
        }
        if (threeAvailable) {
            uploadPromises.push(uploadToPoiWithProgress(files, state.poiIPs.poiThreeIP, 'POI 3'));
        }
        if (fourAvailable) {
            uploadPromises.push(uploadToPoiWithProgress(files, state.poiIPs.poiFourIP, 'POI 4'));
        }
        if (fiveAvailable) {
            uploadPromises.push(uploadToPoiWithProgress(files, state.poiIPs.poiFiveIP, 'POI 5'));
        }
        if (sixAvailable) {
            uploadPromises.push(uploadToPoiWithProgress(files, state.poiIPs.poiSixIP, 'POI 6'));
        }
        if (sevenAvailable) {
            uploadPromises.push(uploadToPoiWithProgress(files, state.poiIPs.poiSevenIP, 'POI 7'));
        }
        if (eightAvailable) {
            uploadPromises.push(uploadToPoiWithProgress(files, state.poiIPs.poiEightIP, 'POI 8'));
        }

        await Promise.all(uploadPromises);
        
        statusEl.textContent = 'Upload completed successfully!';
        statusEl.style.color = 'green';
        uploadSuccess = true;
        
    } catch (error) {
        console.error('Upload error:', error);
        statusEl.textContent = `Upload failed: ${error.message}`;
        statusEl.style.color = 'red';
    } finally {
        // Only update if upload wasn't already cancelled
        if (uploadInProgress) {
            uploadInProgress = false;
            if (uploadSuccess) {
                uploadBtn.textContent = 'Upload to POI';
            } else {
                uploadBtn.textContent = 'Try again';
            }
        }
        uploadBtn.disabled = false;
        fileInput.disabled = false;
    }
}

async function verifyPoiConnectionMB(ip) {
  // New simplified check that just verifies basic connectivity
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);
  abortControllers.push(controller);

  try {
    // Try HEAD request first as it's lighter
    await fetch(`http://${ip}/edit`, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });
    return true;
  } catch (error) {
    // If HEAD fails, try GET as fallback
    try {
      await fetch(`http://${ip}/get-pixels`, {
        method: 'GET', 
        mode: 'no-cors',
        signal: controller.signal
      });
      return true;
    } catch (e) {
      // Final fallback - just attempt to connect
      return new Promise(resolve => {
        const img = new Image();
        img.onerror = () => resolve(true); // Even 404 means POI is reachable
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

async function uploadToPoiWithProgress(files, ip, label) {
  const statusEl = document.getElementById('upload-status-standalone');
  const config = state.magicBridge.CONFIG;
  
  try {
    const batchCount = Math.ceil(files.length / config.BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const batchStart = batchIndex * config.BATCH_SIZE;
      const batchFiles = files.slice(batchStart, batchStart + config.BATCH_SIZE);
      
      statusEl.textContent = `Uploading to ${label}: Batch ${batchIndex+1}/${batchCount}`;
      
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
    statusEl.textContent = `Uploading timings to ${label}...`;

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

    // Check content type before attempting JSON parse
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      console.warn(`Timings endpoint on ${label} returned non-JSON response (likely not supported by this POI firmware)`);
      statusEl.textContent = `Timings skipped for ${label} (endpoint may not support timings)`;
      return;
    }

    const result = await response.json();
    console.log('Timings upload result:', result);
    statusEl.textContent = `Timings uploaded to ${label} successfully`;
  } catch (error) {
    console.error(`Failed to upload timings to ${label}:`, error);
    // Don't throw - timings failure shouldn't break the whole upload
    statusEl.textContent = `Timings upload to ${label} failed: ${error.message}`;
  }
}
function adjustTimingsArray(timingsArray, targetLength) {
  if (timingsArray.length === targetLength) {
    return timingsArray;
  }

  if (timingsArray.length > targetLength) {
    // Truncate to target length
    return timingsArray.slice(0, targetLength);
  }

  // Extend timings array by repeating the last interval
  const result = [...timingsArray];
  const lastTiming = result[result.length - 1];
  let lastInterval = result.length >= 2 ? lastTiming - result[result.length - 2] : 1000; // default 1 second

  while (result.length < targetLength) {
    result.push(lastTiming + lastInterval * (result.length - timingsArray.length + 1));
  }
  return result;

}
/**
 * Preview timeline data from a ZIP file immediately on selection (no upload)
 * Extracts images.json, .bin data, and audio for TimelinePlayer preview
 */
async function previewTimelineFromZip() {
    const fileInput = document.getElementById('zip-input');
    const statusEl = document.getElementById('upload-status-standalone');
    
    if (!fileInput.files[0]) {
        console.log('[MagicBridge] No file selected for preview');
        return;
    }
    
    const file = fileInput.files[0];
    if (!file.name.toLowerCase().endsWith('.zip')) {
        statusEl.textContent = 'Please select a ZIP file';
        statusEl.style.color = 'red';
        return;
    }
    
    console.log('[MagicBridge] Previewing ZIP file:', file.name);
    statusEl.textContent = 'Reading ZIP for preview...';
    statusEl.style.color = 'inherit';
    
    try {
        const zip = await JSZip.loadAsync(file);
        
        // Parse images.json
        let timelineData = null;
        let imageOrder = null;
        let timingsArray = null;
        let binArrayBuffers = [];
        let mp3BlobUrl = null;
        
        try {
            const jsonFile = zip.file("images.json");
            if (jsonFile) {
                const jsonContent = await jsonFile.async('text');
                const jsonData = JSON.parse(jsonContent);
                timelineData = jsonData;
                console.log('[MagicBridge] images.json parsed:', jsonData.timeline_title || 'Untitled');
                
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
            statusEl.textContent = 'No images.json found in ZIP';
            statusEl.style.color = 'orange';
            return;
        }
        
        // Get .bin files
        const binFiles = Object.values(zip.files).filter(file => {
            const fileName = file.name.split('/').pop().trim();
            return !file.dir && /\.bin$/i.test(fileName) && !file.name.includes('__MACOSX/');
        });
        
        let orderedBinFiles = [];
        if (imageOrder) {
            const fileMap = {};
            binFiles.forEach(file => {
                const fileName = file.name.split('/').pop().trim();
                const baseName = fileName.split('.')[0];
                fileMap[baseName] = file;
            });
            orderedBinFiles = imageOrder.map(baseName => fileMap[baseName]).filter(f => f !== null);
        } else {
            orderedBinFiles = binFiles.sort((a, b) => a.name.localeCompare(b.name));
        }
        
        // Extract arraybuffers for TimelinePlayer AND create File objects for upload cache
        const uploadFiles = (await Promise.all(orderedBinFiles.map(async (file) => {
            try {
                const arrayBuffer = await file.async('arraybuffer');
                if (arrayBuffer) binArrayBuffers.push(arrayBuffer);
            } catch (e) {
                console.warn('[MagicBridge] Failed to extract binary data from', file.name);
            }
            // Also create File object for upload (with its own error handling)
            try {
                const blob = await file.async('blob');
                const originalFileName = file.name.split('/').pop().trim();
                return new File([blob], originalFileName, {
                    type: 'application/octet-stream'
                });
            } catch (e) {
                console.warn('[MagicBridge] Failed to create blob from', file.name, e);
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
                console.log('[MagicBridge] Audio file extracted:', audioFile.name);
                statusEl.textContent += ' Audio found.';
            }
        } catch (e) {
            console.warn('[MagicBridge] No audio extracted');
        }
        
        // Populate ZIP cache for later upload
        zipCache.files = uploadFiles;
        zipCache.timingsArray = timingsArray;
        zipCache.timelineData = timelineData;
        zipCache.binArrayBuffers = binArrayBuffers;
        zipCache.mp3BlobUrl = mp3BlobUrl;
        zipCache.isLoaded = true;
        
        // Show file list for upload
        document.getElementById('file-list').style.display = 'block';
        document.getElementById('file-names').innerHTML = uploadFiles
            .map(f => `<li>${f.name}</li>`)
            .join('');
        
        statusEl.textContent = `Loaded ${binArrayBuffers.length} images. Initializing timeline...`;
        
        // Initialize TimelinePlayer
        if (typeof TimelinePlayer !== 'undefined' && typeof TimelinePlayer.loadTimelineData === 'function') {
            try {
                TimelinePlayer.setAudioUrl(mp3BlobUrl);
                // Await the async loadTimelineData to catch any errors
                await TimelinePlayer.loadTimelineData(timelineData, binArrayBuffers);
                console.log('[MagicBridge] TimelinePlayer initialized from ZIP preview');
                statusEl.textContent = `Timeline ready: ${binArrayBuffers.length} images loaded.`;
                statusEl.style.color = '#90c695';
            } catch (tlErr) {
                console.error('[MagicBridge] TimelinePlayer init failed:', tlErr);
                statusEl.textContent = 'Timeline init failed: ' + tlErr.message;
                statusEl.style.color = 'red';
            }
        } else {
            console.warn('[MagicBridge] TimelinePlayer not available');
            statusEl.textContent = 'TimelinePlayer not available';
        }
        
    } catch (error) {
        console.error('[MagicBridge] ZIP preview failed:', error);
        statusEl.textContent = 'Failed to read ZIP: ' + error.message;
        statusEl.style.color = 'red';
    }
}
