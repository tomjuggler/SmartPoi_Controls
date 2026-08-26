// Upload Bin Handlers
async function verifyPoiConnection(ip) {
  for(let attempt = 1; attempt <= state.upload.config.POI_CHECK_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `http://${ip}/get-pixels`,
        state.upload.config.POI_CHECK_TIMEOUT
      );
      
      if(response.ok) {
        return true;
      }
    } catch(error) {
      if(attempt === state.upload.config.POI_CHECK_RETRIES) {
        return false;
      }
      await delay(state.upload.config.RETRY_BACKOFF[attempt-1]);
    }
  }
  return false;
}

async function restoreOriginalPatterns(mainAvailable = true, auxAvailable = true, threeAvailable = false, fourAvailable = false, fiveAvailable = false, sixAvailable = false, sevenAvailable = false, eightAvailable = false) {
  const restoreTasks = [];
  if(mainAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.mainIP));
  if(auxAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.auxIP));
  if(threeAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.poiThreeIP));
  if(fourAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.poiFourIP));
  if(fiveAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.poiFiveIP));
  if(sixAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.poiSixIP));
  if(sevenAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.poiSevenIP));
  if(eightAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.poiEightIP));
  
  await Promise.allSettled(restoreTasks);
  await delay(1000); // Final safety delay
}

// Show status in the Upload Bin tab
function showUploadStatus(message, type = 'info') {
    const statusEl = document.getElementById('uploadBinStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `upload-status ${type}`;
        
        // Auto-clear non-error messages after 5 seconds
        if (type !== 'error') {
            setTimeout(() => {
                if (statusEl.textContent === message) {
                    statusEl.textContent = '';
                    statusEl.className = 'upload-status';
                }
            }, 5000);
        }
    }
}

let originalPattern; // Will store the original pattern during upload

async function fetchOriginalPattern() {
  try {
    const response = await fetch(`http://${state.poiIPs.mainIP}/returnsettings`);
    if (response.ok) {
      const data = await response.text();
      const parts = data.split(',');
      originalPattern = parts[parts.length - 1].trim();
    }
  } catch (error) {
    originalPattern = 1;
  }
}

async function setPatternSafe(pattern, ip) {
  await fetchWithTimeout(`http://${ip}/pattern?patternChooserChange=${pattern}`, 5000);
  await delay(500); // Allow flash write cycle
}

async function fetchWithTimeout(resource, timeout=5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, { signal: controller.signal });
  clearTimeout(id);
  return response;
}

// Upload Bin Handlers
async function handleUpload() {
    if (!state.upload.orderedFiles.length) {
        createMessage('Please select at least one file', 'warning');
        return;
    }

    try {
        // Keep the screen awake for the duration of the batch upload
        if (typeof window.keepAwake === 'function') {
            window.keepAwake(true);
        }
        createMessage('Starting upload process...', 'info');
        showUploadStatus('Starting upload process...', 'info');
        
        // Verify POI connections
        showUploadStatus('Checking POI connections...', 'info');
        const [mainAvailable, auxAvailable, threeAvailable, fourAvailable, fiveAvailable, sixAvailable, sevenAvailable, eightAvailable] = await Promise.all([
            verifyPoiConnection(state.poiIPs.mainIP),
            verifyPoiConnection(state.poiIPs.auxIP),
            verifyPoiConnection(state.poiIPs.poiThreeIP),
            verifyPoiConnection(state.poiIPs.poiFourIP),
            verifyPoiConnection(state.poiIPs.poiFiveIP),
            verifyPoiConnection(state.poiIPs.poiSixIP),
            verifyPoiConnection(state.poiIPs.poiSevenIP),
            verifyPoiConnection(state.poiIPs.poiEightIP)
        ]);

        if (!mainAvailable && !auxAvailable && !threeAvailable && !fourAvailable && !fiveAvailable && !sixAvailable && !sevenAvailable && !eightAvailable) {
            throw new Error("No POIs are available - upload cannot proceed");
        }

        // Store original patterns
        showUploadStatus('Storing original patterns...', 'info');
        await fetchOriginalPattern();

        // Set upload patterns
        showUploadStatus('Setting upload mode on POIs...', 'info');
        const patternTasks = [];
        if (mainAvailable) patternTasks.push(setPatternSafe(7, state.poiIPs.mainIP));
        if (auxAvailable) patternTasks.push(setPatternSafe(7, state.poiIPs.auxIP));
        if (threeAvailable) patternTasks.push(setPatternSafe(7, state.poiIPs.poiThreeIP));
        if (fourAvailable) patternTasks.push(setPatternSafe(7, state.poiIPs.poiFourIP));
        if (fiveAvailable) patternTasks.push(setPatternSafe(7, state.poiIPs.poiFiveIP));
        if (sixAvailable) patternTasks.push(setPatternSafe(7, state.poiIPs.poiSixIP));
        if (sevenAvailable) patternTasks.push(setPatternSafe(7, state.poiIPs.poiSevenIP));
        if (eightAvailable) patternTasks.push(setPatternSafe(7, state.poiIPs.poiEightIP));
        await Promise.all(patternTasks);
        await delay(state.upload.config.INTER_POI_DELAY);

        // Prepare files list with new naming convention
        const filesToUpload = state.upload.orderedFiles.map((file, index) => ({
            file,
            targetName: generateUploadBinFilename(index)
        }));

        // Define POI pairs: [ip1, ip2, label1, label2, avail1, avail2]
        const pairs = [
            [state.poiIPs.mainIP, state.poiIPs.auxIP, "Main POI", "Aux POI", mainAvailable, auxAvailable],
            [state.poiIPs.poiThreeIP, state.poiIPs.poiFourIP, "POI 3", "POI 4", threeAvailable, fourAvailable],
            [state.poiIPs.poiFiveIP, state.poiIPs.poiSixIP, "POI 5", "POI 6", fiveAvailable, sixAvailable],
            [state.poiIPs.poiSevenIP, state.poiIPs.poiEightIP, "POI 7", "POI 8", sevenAvailable, eightAvailable]
        ];

        const uploadTasks = [];

        for (const [ip1, ip2, label1, label2, avail1, avail2] of pairs) {
            if (!avail1 && !avail2) continue;

            // Determine the IP to fetch pixel count from (prefer the first available)
            const pixelSourceIp = avail1 ? ip1 : ip2;

            // Fetch pixel count for this POI pair
            let pairPixelCount;
            try {
                const response = await fetch(`http://${pixelSourceIp}/get-pixels`);
                if (response.ok) {
                    pairPixelCount = parseInt(await response.text(), 10);
                } else {
                    pairPixelCount = state.settings.pixels;
                }
            } catch (error) {
                pairPixelCount = state.settings.pixels;
            }

            // Build target IPs array and label
            const targetIps = [];
            const pairLabelParts = [];
            if (avail1) { targetIps.push(ip1); pairLabelParts.push(label1); }
            if (avail2) { targetIps.push(ip2); pairLabelParts.push(label2); }
            const pairLabel = pairLabelParts.join(' & ');

            uploadTasks.push(
                processPairWithBackoff(filesToUpload, targetIps, pairPixelCount, pairLabel)
                    .then(() => createMessage(`${pairLabel}: upload complete`))
            );
        }

        await Promise.all(uploadTasks);
        
        // Restore original patterns
        showUploadStatus('Restoring original patterns...', 'info');
        const connectedPOIs = [];
        if (mainAvailable) connectedPOIs.push('Main POI');
        if (auxAvailable) connectedPOIs.push('Aux POI');
        if (threeAvailable) connectedPOIs.push('POI 3');
        if (fourAvailable) connectedPOIs.push('POI 4');
        if (fiveAvailable) connectedPOIs.push('POI 5');
        if (sixAvailable) connectedPOIs.push('POI 6');
        if (sevenAvailable) connectedPOIs.push('POI 7');
        if (eightAvailable) connectedPOIs.push('POI 8');
        await restoreOriginalPatterns(mainAvailable, auxAvailable, threeAvailable, fourAvailable, fiveAvailable, sixAvailable, sevenAvailable, eightAvailable);
        
        const msg = `Upload completed to ${connectedPOIs.length > 0 ? connectedPOIs.join(', ') : 'No POIs'}`;
        createMessage(msg);
        showUploadStatus(msg, 'success');

    } catch (error) {
        showUploadStatus(`Upload failed: ${error.message}`, 'error');
        handleCriticalError(error);
    } finally {
        // Upload finished (success or failure) - allow the screen to sleep again
        if (typeof window.keepAwake === 'function') {
            window.keepAwake(false);
        }
        state.upload.orderedFiles = [];
        document.getElementById('fileListContainer').innerHTML = '';
        document.getElementById('uploadFileInput').value = '';
    }
}

function logBatchCompletion(batchNumber, totalBatches, label) {
  const progress = `${batchNumber}/${totalBatches} batches`;
  createMessage(`${label}: Completed ${progress} (${batchNumber * state.upload.config.BATCH_SIZE} files)`);
}

async function processPairWithBackoff(filesToUpload, targetIps, pairPixelCount, label) {
    const batchCount = Math.ceil(filesToUpload.length / state.upload.config.BATCH_SIZE);
    
    showUploadStatus(`${label}: Starting upload of ${filesToUpload.length} file(s)...`, 'info');
    
    for(let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
        const batchStart = batchIndex * state.upload.config.BATCH_SIZE;
        const batchFiles = filesToUpload.slice(batchStart, batchStart + state.upload.config.BATCH_SIZE);
        
        showUploadStatus(`${label}: Processing file ${batchIndex + 1} of ${filesToUpload.length}...`, 'info');
        
        await processPairBatch(batchFiles, targetIps, pairPixelCount, label, batchIndex+1, batchCount);
        
        if(batchIndex < batchCount - 1) {
            await delay(state.upload.config.INTER_BATCH_DELAY);
        }
    }
    
    showUploadStatus(`${label}: Upload completed`, 'success');
}

async function processPairBatch(batchFiles, targetIps, pairPixelCount, label, batchNumber, totalBatches) {
    const batchPromises = batchFiles.map(async (fileData) => {
        showUploadStatus(`${label}: Uploading ${fileData.file.name}...`, 'info');
        await processFileForPairWithRetry(fileData, targetIps, pairPixelCount);
        await delay(state.upload.config.INTER_FILE_DELAY);
    });
    
    await Promise.allSettled(batchPromises);
    logBatchCompletion(batchNumber, totalBatches, label);
}

async function processFileForPair(fileData, targetIps, pairPixelCount) {
    let binaryData;
    
    // Check if file is already a .bin file
    if (fileData.file.name.toLowerCase().endsWith('.bin')) {
        // Read .bin file directly without processing
        const reader = new FileReader();
        binaryData = await new Promise((resolve, reject) => {
            reader.onload = (e) => resolve(new Uint8Array(e.target.result));
            reader.onerror = reject;
            reader.readAsArrayBuffer(fileData.file);
        });
    } else {
        // Process image files through Jimp with pair-specific pixel count
        binaryData = await processImageFile(fileData.file, pairPixelCount);
    }
    
    // Upload the same compressed data to all target IPs in the pair
    const blob = new Blob([binaryData], { type: 'application/octet-stream' });
    
    const uploadPromises = targetIps.map(ip => {
        const formData = new FormData();
        formData.append('file', blob, fileData.targetName);
        return fetch(`http://${ip}/edit`, {
            method: 'POST',
            body: formData
        }).then(response => {
            if (!response.ok) {
                throw new Error(`Upload to ${ip} failed: ${response.statusText}`);
            }
        });
    });
    
    await Promise.all(uploadPromises);
}

async function processFileForPairWithRetry(fileData, targetIps, pairPixelCount) {
    for(let attempt = 1; attempt <= state.upload.config.MAX_RETRIES; attempt++) {
        try {
            await processFileForPair(fileData, targetIps, pairPixelCount);
            return; // Success - exit retry loop
        } catch(error) {
            if (attempt === state.upload.config.MAX_RETRIES) {
                throw new Error(`Failed after ${attempt} attempts: ${error.message}`);
            }
            await delay(state.upload.config.RETRY_BACKOFF[attempt-1]);
        }
    }
}

function initializeUploadHandlers() {
    // Initialize upload tab inputs with current state
    updateAllPixelDisplays(state.settings.pixels);

    // Ensure sequential upload to prevent concatenation issues
    state.upload.config.BATCH_SIZE = 1;

    // File input handler
    document.getElementById('uploadFileInput').addEventListener('change', async function(e) {
        const container = document.getElementById('fileListContainer');
        container.innerHTML = '';
        state.upload.orderedFiles = Array.from(e.target.files);
        
        // Check for ZIP files and extract them immediately
        const containsZip = state.upload.orderedFiles.some(file => file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip'));
        
        if (containsZip) {
            createMessage('ZIP file detected, extracting files...', 'info');
            const extractedFiles = [];
            
            for (const file of state.upload.orderedFiles) {
                if (file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip')) {
                    try {
                        const zip = await JSZip.loadAsync(file);
                        
                        // First, check for images.json and parse it to get the image order
                        let imageOrder = null;
                        try {
                            const jsonFile = zip.file("images.json");
                            if (jsonFile) {
                                const jsonContent = await jsonFile.async('text');
                                const jsonData = JSON.parse(jsonContent);
                                if (jsonData.images_ordered && Array.isArray(jsonData.images_ordered)) {
                                    imageOrder = jsonData.images_ordered.map(name => {
                                        // Extract the name part before the first dot (e.g., "Axel_32" from "Axel_32.jpg")
                                        return name.split('.')[0];
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Error parsing images.json:', error);
                            imageOrder = null; // Fall back to default order
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
                        const extracted = await Promise.all(
                            orderedBinFiles.map(async (file) => {
                                const blob = await file.async('blob');
                                const originalFileName = file.name.split('/').pop().trim();
                                return new File([blob], originalFileName, {
                                    type: 'application/octet-stream'
                                });
                            })
                        );
                        
                        extractedFiles.push(...extracted);
                    } catch (error) {
                        console.error('Error processing ZIP file:', error);
                        createMessage(`Failed to read ZIP file: ${file.name}`, 'error');
                        // Keep the original ZIP file in the list if extraction fails
                        extractedFiles.push(file);
                    }
                } else {
                    extractedFiles.push(file); // Keep non-ZIP files
                }
            }
            state.upload.orderedFiles = extractedFiles;
        }
        
        // Update UI to show files (either extracted .bin files or original files)
        state.upload.orderedFiles.forEach((file, index) => {
            container.appendChild(createFileListItem(file, index));
        });
        
        if (containsZip) {
            createMessage(`Extracted ${state.upload.orderedFiles.length} files from ZIP`, 'info');
        }
    });

    // Upload button handler - updated to use correct ID
    document.getElementById('uploadBinButton').addEventListener('click', handleUpload);

    // WS/APA toggle handler
    // WS/APA toggle handler
    document.getElementById('uploadWsApaBtn').addEventListener('click', function() {
        state.wsStrip = !state.wsStrip;
        // Update stripType to match WS2812/APA102
        state.stripType = state.wsStrip ? "WS2812" : "APA102";
        const indicator = document.getElementById('uploadWsApaIndicator');
        indicator.textContent = `Current: ${state.stripType}`;
        createMessage(`Switched to ${state.stripType} mode`);
        updateStripTypeIndicator(); // Update all indicators
        saveState();
    });

    // Pixel update handler
    document.getElementById('uploadUpdatePixelButton').addEventListener('click', function() {
        const pixelInput = document.getElementById('uploadPixelInput').value;
        state.settings.pixels = parseInt(pixelInput, 10);
        updatePixelSize(); // Use the unified update function
        saveState();
    });
    initializeDragAndDrop();
}
function createFileListItem(file, index) {
    const div = document.createElement('div');
    div.className = 'draggable-file';
    div.draggable = true;
    div.dataset.index = index;
    div.dataset.fileName = file.name;

    // Preview image
    const img = document.createElement('img');

    // Handle different file types
    if (file.name.toLowerCase().endsWith('.bin')) {
        // For .bin files, use decompress to create preview
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target.result;
                const binaryData = new Uint8Array(arrayBuffer);
                const imageUrl = await decompress(binaryData);
                const rotatedImageUrl = await rotateImage90(imageUrl);
                img.src = rotatedImageUrl;
            } catch (error) {
                console.error('Error creating preview for .bin file:', error);
                // Fallback to placeholder
                img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        // For image files, use object URL
        img.src = URL.createObjectURL(file);
    }

    // Filename
    const span = document.createElement('span');
    span.textContent = file.name;

    // Drag handle
    const handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.innerHTML = '☰';

    div.appendChild(img);
    div.appendChild(span);
    div.appendChild(handle);

    // Drag & drop handlers
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    div.addEventListener('dragend', handleDragEnd);

    return div;
}
function generateNewFilename(containerId) {
    // This function is only used for initial grid creation now
    const container = document.getElementById(containerId);
    const existingFiles = new Set(
        Array.from(container.querySelectorAll('.image-wrapper'))
            .map(el => el.dataset.fileName)
            .filter(Boolean)
    );

    // Only create numbered names if the title starts with a number
    const numbers = Array.from({length: 100}, (_, i) => i);
    for (const num of numbers) {
        const testName = `${num}.bin`;
        if (!existingFiles.has(testName)) {
            return testName;
        }
    }
    return `${Date.now()}.bin`; // fallback with timestamp
}
function handleFileInput(e) {
  const container = document.getElementById('fileListContainer');
  container.innerHTML = '';
  state.upload.orderedFiles = Array.from(e.target.files);

  state.upload.orderedFiles.forEach((file, index) => {
    const listItem = createFileListItem(file, index);
    container.appendChild(listItem);
  });
}
function sanitizeFileName(name) {
    // Only sanitize - keep original numbers and names
    const base = name.replace(/\.bin$/i, '')
                     .replace(/[^a-zA-Z0-9-_.]/g, '') // Allow periods
                     .substring(0, 50);
    return `${base}.bin`;
}

function validateFileName(name) {
    return /^[a-zA-Z0-9-_.]{1,50}\.bin$/i.test(name) ? name : null;
}
// Drag and drop handlers for file reordering
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.index);
}

function handleDragOver(e) {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    const container = document.getElementById('fileListContainer');
    const afterElement = getDragAfterElement(container, e.clientY);

    if(afterElement) {
        container.insertBefore(dragging, afterElement);
    } else {
        container.appendChild(dragging);
    }
}

function handleDrop(e) {
    e.preventDefault();
    updateFilesOrder();
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable-file:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateFilesOrder() {
    const fileList = document.getElementById('fileListContainer');
    const children = Array.from(fileList.children);
    const newOrder = [];
    const remainingFiles = [...state.upload.orderedFiles]; // shallow copy
    
    children.forEach((child, newIndex) => {
        child.dataset.index = newIndex;
        const fileName = child.dataset.fileName;
        
        // Find corresponding file object in remainingFiles
        const fileIndex = remainingFiles.findIndex(f => f.name === fileName);
        if (fileIndex !== -1) {
            newOrder.push(remainingFiles[fileIndex]);
            remainingFiles.splice(fileIndex, 1); // remove matched file
        } else {
            console.error('File not found in orderedFiles:', fileName);
        }
    });
    
    // If any files remain (should not happen), append them
    if (remainingFiles.length > 0) {
        console.warn('Some files were not in DOM, appending to end:', remainingFiles.map(f => f.name));
        newOrder.push(...remainingFiles);
    }
    
    // Update state with new order
    state.upload.orderedFiles = newOrder;
    console.log('Updated file order:', newOrder.map(f => f.name));
}
function initializeDragAndDrop() {
  const container = document.getElementById('fileListContainer');

  container.addEventListener('dragover', e => {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    const afterElement = getDragAfterElement(container, e.clientY);

    if(afterElement) {
      container.insertBefore(dragging, afterElement);
    } else {
      container.appendChild(dragging);
    }
  });

  container.addEventListener('drop', e => {
    e.preventDefault();
    updateFilesOrder();
  });
}