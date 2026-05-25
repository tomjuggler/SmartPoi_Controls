// Utility Functions
const MAX_RETRY_COUNT = 3;
const UPLOAD_BIN_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
let retryCount = 0;

// Utility Functions
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Device Detection Utility
function isDesktopDevice() {
    // Check if device has touch capability (mobile/tablet)
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check screen width (desktop typically > 768px)
    const isWideScreen = window.innerWidth > 768;
    
    // Optional: Check user agent for additional hints
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Desktop detection logic:
    // - Consider it desktop if screen is wide AND either:
    //   a) No touch capability, OR
    //   b) Has touch but user agent doesn't indicate mobile device
    return isWideScreen && (!hasTouch || (hasTouch && !isMobileUserAgent));
}

// Make function available globally
window.isDesktopDevice = isDesktopDevice;

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

async function restoreOriginalPatterns(mainAvailable = true, auxAvailable = true, threeAvailable = false, fourAvailable = false) {
  const restoreTasks = [];
  if(mainAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.mainIP));
  if(auxAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.auxIP));
  if(threeAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.poiThreeIP));
  if(fourAvailable) restoreTasks.push(setPatternSafe(originalPattern, state.poiIPs.poiFourIP));
  
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
    document.getElementById('manualPoiThreeIp').placeholder = state.poiIPs.poiThreeIP;
    document.getElementById('manualPoiFourIp').placeholder = state.poiIPs.poiFourIP;
    document.getElementById('manualPoiFiveIp').placeholder = state.poiIPs.poiFiveIP;
    document.getElementById('manualPoiSixIp').placeholder = state.poiIPs.poiSixIP;
    document.getElementById('manualPoiSevenIp').placeholder = state.poiIPs.poiSevenIP;
    document.getElementById('manualPoiEightIp').placeholder = state.poiIPs.poiEightIP;
    
    // Show/hide router-only elements based on mode
    const routerOnlyElements = document.querySelectorAll('.router-only');
    routerOnlyElements.forEach(el => {
        el.style.display = state.poiIPs.routerMode ? 'block' : 'none';
    });
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
    // Update display for specific POI (main, aux, three, or four)
    const displayCount = (pixelCount === null || pixelCount === undefined || pixelCount === '?') ? '?' : pixelCount;
    
    if (poiType === 'main') {
        state.settings.pixels = pixelCount;
        updateAllPixelDisplays(pixelCount);
    } else if (poiType === 'aux') {
        state.settings.pixelsTwo = pixelCount;
        const el = document.getElementById('pixelsTwo');
        if (el) el.textContent = displayCount;
    } else if (poiType === 'three') {
        state.settings.pixelsThree = pixelCount;
        const el = document.getElementById('pixelsThree');
        if (el) el.textContent = displayCount;
    } else if (poiType === 'four') {
        state.settings.pixelsFour = pixelCount;
        const el = document.getElementById('pixelsFour');
        if (el) el.textContent = displayCount;
    } else if (poiType === 'five') {
        state.settings.pixelsFive = pixelCount;
        const elFive = document.getElementById('pixelsFive');
        if (elFive) elFive.textContent = displayCount;
    } else if (poiType === 'six') {
        state.settings.pixelsSix = pixelCount;
        const elSix = document.getElementById('pixelsSix');
        if (elSix) elSix.textContent = displayCount;
    } else if (poiType === 'seven') {
        state.settings.pixelsSeven = pixelCount;
        const elSeven = document.getElementById('pixelsSeven');
        if (elSeven) elSeven.textContent = displayCount;
    } else if (poiType === 'eight') {
        state.settings.pixelsEight = pixelCount;
        const elEight = document.getElementById('pixelsEight');
        if (elEight) elEight.textContent = displayCount;
    }
}

function getPoiIPs() {
    const ips = [state.poiIPs.mainIP, state.poiIPs.auxIP];
    if (state.poiIPs.routerMode && state.poiIPs.poiThreeIP && state.poiIPs.poiThreeIP !== '0.0.0.0') {
        ips.push(state.poiIPs.poiThreeIP);
    }
    if (state.poiIPs.routerMode && state.poiIPs.poiFourIP && state.poiIPs.poiFourIP !== '0.0.0.0') {
        ips.push(state.poiIPs.poiFourIP);
    }
    if (state.poiIPs.routerMode && state.poiIPs.poiFiveIP && state.poiIPs.poiFiveIP !== '0.0.0.0') {
        ips.push(state.poiIPs.poiFiveIP);
    }
    if (state.poiIPs.routerMode && state.poiIPs.poiSixIP && state.poiIPs.poiSixIP !== '0.0.0.0') {
        ips.push(state.poiIPs.poiSixIP);
    }
    if (state.poiIPs.routerMode && state.poiIPs.poiSevenIP && state.poiIPs.poiSevenIP !== '0.0.0.0') {
        ips.push(state.poiIPs.poiSevenIP);
    }
    if (state.poiIPs.routerMode && state.poiIPs.poiEightIP && state.poiIPs.poiEightIP !== '0.0.0.0') {
        ips.push(state.poiIPs.poiEightIP);
    }
    return ips;
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
            poiThreeIP: state.poiIPs.poiThreeIP,
            poiFourIP: state.poiIPs.poiFourIP,
            poiFiveIP: state.poiIPs.poiFiveIP,
            poiSixIP: state.poiIPs.poiSixIP,
            poiSevenIP: state.poiIPs.poiSevenIP,
            poiEightIP: state.poiIPs.poiEightIP,
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