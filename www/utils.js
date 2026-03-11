// Utility Functions
const MAX_RETRY_COUNT = 3;
const UPLOAD_BIN_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
let retryCount = 0;

// Utility Functions
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createMessage(message, type = 'info') {
    const modal = document.getElementById('messageModal');
    modal.textContent = message;
    modal.className = `message-modal ${type}`;
    
    // Add active class with slight delay for transition
    setTimeout(() => modal.classList.add('active'), 10);
    
    // Remove after 2 seconds
    setTimeout(() => {
        modal.classList.remove('active');
    }, 2000);
}

function handleCriticalError(error) {
    console.error('Critical Error:', error);
    createMessage(`Upload failed: ${error.message}`, 'error');
    // Attempt to restore original patterns even on failure
    restoreOriginalPatterns().catch(err => {
        console.error('Failed to restore patterns:', err);
    });
}

async function restoreOriginalPatterns(mainAvailable = true, auxAvailable = true) {
  const restoreTasks = [];
  if(mainAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.mainIP));
  if(auxAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.auxIP));
  
  await Promise.allSettled(restoreTasks);
  await delay(1000); // Final safety delay
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        setTimeout(() => element.style.display = 'none', 3000);
    } else {
        console.error(`Element with id '${elementId}' not found.`);
    }
}

function validateIP(ip) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}

function showLoadingState(show) {
  const spinner = document.getElementById('spinner');
  const counter = document.getElementById('counter');
  const currentIP = document.getElementById('currentIP');
  
  if (spinner) spinner.style.display = show ? 'block' : 'none';
  if (counter) counter.style.display = show ? 'block' : 'none';
  if (currentIP && !show) currentIP.textContent = '0'; // Reset counter when done
}

function updateNetworkModeDisplay() {
    const modeIndicator = document.getElementById('networkModeIndicator');
    const ipInputs = document.querySelectorAll('.manual-ip-row input');
    
    if (state.poiIPs.routerMode) {
        modeIndicator.textContent = "Router Mode";
        modeIndicator.className = "status-indicator online";
        ipInputs.forEach(input => input.disabled = false);
    } else {
        modeIndicator.textContent = "AP Mode";
        modeIndicator.className = "status-indicator offline";
        ipInputs.forEach(input => {
            input.disabled = true;
            // Force display of default values
            input.value = input.placeholder;
        });
    }
    
    // Update placeholders to current values
    document.getElementById('manualMainIp').placeholder = state.poiIPs.mainIP;
    document.getElementById('manualAuxIp').placeholder = state.poiIPs.auxIP;
}

function updateStripTypeIndicator() {
    let text = `Current: ${state.stripType}`;
    if (state.stripType === "CUSTOM") {
        text += ` (${state.customCompression}%)`;
    }
    document.getElementById('ws_apa_indicator').textContent = text;
    document.getElementById('uploadWsApaIndicator').textContent = text;
}

async function fetchNumberOfPixels(ip) {
    try {
        const response = await fetch(`http://${ip}/get-pixels`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return parseInt(await response.text(), 10);
    } catch (error) {
        console.error(`Error fetching pixels from ${ip}:`, error);
        return null;
    }
}

function updateAllPixelDisplays(pixelCount) {
    // Handle unavailable pixel count (null, undefined, or '?')
    const displayCount = (pixelCount === null || pixelCount === undefined || pixelCount === '?') ? '?' : pixelCount;
    const inputValue = (pixelCount === null || pixelCount === undefined || pixelCount === '?') ? '' : pixelCount;
    
    // Update global state (store actual value, even if null)
    state.settings.pixels = pixelCount;
    
    // Update all UI elements that depend on global pixel count
    const pixelInput = document.getElementById('pixelInput');
    const uploadPixelInput = document.getElementById('uploadPixelInput');
    const currentPx = document.getElementById('currentPx');
    const uploadCurrentPx = document.getElementById('uploadCurrentPx');
    
    if (pixelInput) pixelInput.value = inputValue;
    if (uploadPixelInput) uploadPixelInput.value = inputValue;
    if (currentPx) currentPx.textContent = `Current px: ${displayCount}`;
    if (uploadCurrentPx) uploadCurrentPx.textContent = `Current px: ${displayCount}`;
    
    // Save state to persist the pixel count
    saveState();
}

function updatePixelDisplayForPoi(poiType, pixelCount) {
    // Update display for specific POI (main or aux)
    if (poiType === 'main') {
        state.settings.pixels = pixelCount;
        updateAllPixelDisplays(pixelCount);
    } else if (poiType === 'aux') {
        // Handle unavailable pixel count for aux POI
        const displayCount = (pixelCount === null || pixelCount === undefined || pixelCount === '?') ? '?' : pixelCount;
        state.settings.pixelsTwo = pixelCount;
        const pixelsTwoEl = document.getElementById('pixelsTwo');
        if (pixelsTwoEl) pixelsTwoEl.textContent = displayCount;
    }
}

function sliderToValue(sliderPercent) {
    return sliderPercent <= 50 ? 
        0.5 + Math.floor((sliderPercent / 50) * 60) * 0.5 : 
        30 * Math.pow(1800 / 30, (sliderPercent - 50) / 50);
}

function valueToSlider(value) {
    return value <= 30 ? 
        ((value - 0.5) / 29.5) * 50 * (30 / 29.5) : 
        50 + (Math.log(value / 30) / Math.log(60)) * 50;
}

async function sendRequest(url, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.text();
        } catch (error) {
            if (attempt === retries) {
                createMessage(`Request failed: ${error.message}`, 'error');
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    }
}

// State Persistence
function saveState() {
    localStorage.setItem('poiState', JSON.stringify({
        stripType: state.stripType,
        customCompression: state.customCompression,
        poiIPs: {
            mainIP: state.poiIPs.mainIP,
            auxIP: state.poiIPs.auxIP,
            routerMode: state.poiIPs.routerMode,
            savedRouterIPs: state.poiIPs.savedRouterIPs,
            subnet: state.poiIPs.subnet
        },
        settings: state.settings
    }));
}



function generateUploadBinFilename(index) {
    const char = UPLOAD_BIN_CHARS.charAt(index);
    return `${char}.bin`;
}

function getCharFromIndex(index) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return characters.charAt(index);
}

function validateIP(ip) {
    return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}

function isValidIP(ip) {
  return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip);
}

function showLoadingState(show) {
  const spinner = document.getElementById('spinner');
  const counter = document.getElementById('counter');
  const currentIP = document.getElementById('currentIP');
  
  if (spinner) spinner.style.display = show ? 'block' : 'none';
  if (counter) counter.style.display = show ? 'block' : 'none';
  if (currentIP && !show) currentIP.textContent = '0'; // Reset counter when done
}