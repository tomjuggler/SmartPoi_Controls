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
    statusEl.textContent = 'Processing ZIP file...';
    statusEl.style.color = 'inherit';
    let uploadSuccess = false;
    try {
        // Read and process ZIP file
        const zip = await JSZip.loadAsync(fileInput.files[0]);

        // Check for images.json and parse it to get the image order and timings
        let imageOrder = null;
        let timingsArray = null;
        try {
            const jsonFile = zip.file("images.json");
            if (jsonFile) {
                const jsonContent = await jsonFile.async('text');
                const jsonData = JSON.parse(jsonContent);
                if (jsonData.images_ordered && Array.isArray(jsonData.images_ordered)) {
                    imageOrder = jsonData.images_ordered.map(name => {
                        // Extract the name part before the first dot (e.g., "image1" from "image1.jpg")
                        return name.split('.')[0];
                    });
                }
                if (jsonData.times && Array.isArray(jsonData.times)) {
                    timingsArray = jsonData.times;
                }
            }
        } catch (error) {
            console.error('Error parsing images.json:', error);
            imageOrder = null; // Fall back to default order
            timingsArray = null;
        }

        // Get all .bin files from the ZIP
        const binFiles = Object.values(zip.files).filter(file => {
            const fileName = file.name.split('/').pop().trim();
            const hasBinExtension = /\.bin$/i.test(fileName);
            return !file.dir && hasBinExtension && !file.name.includes('__MACOSX/');
        });

        let orderedBinFiles = [];

        if (imageOrder) {
            // Create a map from base name (without extension) to the file object
            const fileMap = {};
            binFiles.forEach(file => {
                const fileName = file.name.split('/').pop().trim();
                const baseName = fileName.split('.')[0]; // Get the part before the first dot
                fileMap[baseName] = file;
            });

            // Order the files based on the imageOrder array
            orderedBinFiles = imageOrder.map(baseName => {
                if (fileMap[baseName]) {
                    return fileMap[baseName];
                } else {
                    console.warn(`File not found for base name: ${baseName}`);
                    return null;
                }
            }).filter(file => file !== null); // Remove any null entries for missing files
        } else {
            // Fallback: sort files alphabetically by name
            orderedBinFiles = binFiles.sort((a, b) => a.name.localeCompare(b.name));
        }

        // Create the File objects with original .bin filenames
        const files = await Promise.all(
            orderedBinFiles.map(async (file) => {
                const blob = await file.async('blob');
                const originalFileName = file.name.split('/').pop().trim();
                return new File([blob], originalFileName, {
                    type: 'application/octet-stream'
                });
            })
        );

        if (files.length === 0) {
            throw new Error('No .bin files found in ZIP archive');
        }

        // Show file list
        document.getElementById('file-list').style.display = 'block';
        document.getElementById('file-names').innerHTML = files
            .map(f => `<li>${f.name}</li>`)
            .join('');

        // Proceed with upload
        statusEl.textContent = 'Checking POI connectivity...';
        
        let mainAvailable = false;
        let auxAvailable = false;

        // Connectivity check
        [mainAvailable, auxAvailable] = await Promise.all([
            verifyPoiConnectionMB(state.poiIPs.mainIP),
            verifyPoiConnectionMB(state.poiIPs.auxIP)
        ]);

        if (!mainAvailable && !auxAvailable) {
            throw new Error("No POIs available for upload");
        }

        statusEl.textContent = `Uploading ${files.length} files...`;
        
        // Upload to available POIs
        const uploadPromises = [];
        if (mainAvailable) {
            uploadPromises.push(uploadToPoiWithProgress(files, state.poiIPs.mainIP, 'Main POI'));
        }
        if (auxAvailable) {
            uploadPromises.push(uploadToPoiWithProgress(files, state.poiIPs.auxIP, 'Aux POI'));
        }

        await Promise.all(uploadPromises);
        
        // Upload timings if available
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
            await Promise.allSettled(timingPromises); // Don't let timings failure break the flow
        }
        
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