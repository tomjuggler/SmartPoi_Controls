// Core State Management
const state = {
    stripType: "WS2812",  // APA102, WS2812, CUSTOM
    customCompression: 50,
    upload: {
        orderedFiles: [],
        config: {
            BATCH_SIZE: 2,
            INTER_FILE_DELAY: 750,
            INTER_BATCH_DELAY: 1500,
            INTER_POI_DELAY: 3000,
            MAX_RETRIES: 3,
            RETRY_BACKOFF: [500, 1500, 3000],
            POI_CHECK_RETRIES: 2,
            POI_CHECK_TIMEOUT: 3000
        }
    },
    poiIPs: {
        mainIP: "192.168.1.1", 
        auxIP: "192.168.1.78",
        poiThreeIP: "0.0.0.0",
        poiFourIP: "0.0.0.0",
        poiFiveIP: "0.0.0.0",
        poiSixIP: "0.0.0.0",
        poiSevenIP: "0.0.0.0",
        poiEightIP: "0.0.0.0",
        routerMode: false,
        subnet: "",
        savedRouterIPs: {
            main: "",
            aux: "",
            three: "",
            four: "",
            five: "",
            six: "",
            seven: "",
            eight: "",
        }
    },
    currentTab: "controls",
    patterns: {
        current: 1,
        available: 7
    },
    images: {
        main: [],
        aux: [],
        five: [],
        six: [],
        seven: [],
        eight: [],
    },
    settings: {
        pixels: 120,
        brightness: 20,
        speed: 0.5,
        stripType: "WS2812",
        pixelsThree: '?',
        pixelsFour: '?',
        routerThree: 'N/A',
        passwordThree: 'N/A',
        channelThree: 'N/A',
        patternThree: 'N/A',
        routerFour: 'N/A',
        passwordFour: 'N/A',
        channelFour: 'N/A',
        patternFour: 'N/A',
        pixelsFive: '?',
        pixelsSix: '?',
        pixelsSeven: '?',
        pixelsEight: '?',
        routerFive: 'N/A',
        passwordFive: 'N/A',
        channelFive: 'N/A',
        patternFive: 'N/A',
        routerSix: 'N/A',
        passwordSix: 'N/A',
        channelSix: 'N/A',
        patternSix: 'N/A',
        routerSeven: 'N/A',
        passwordSeven: 'N/A',
        channelSeven: 'N/A',
        patternSeven: 'N/A',
        routerEight: 'N/A',
        passwordEight: 'N/A',
        channelEight: 'N/A',
        patternEight: 'N/A',
    },
    currentModalImage: null,
    magicBridge: {
        CONFIG: {
            BATCH_SIZE: 1,
            INTER_FILE_DELAY: 1500,
            INTER_BATCH_DELAY: 3000,
            MAX_RETRIES: 5,
            RETRY_BACKOFF: [1000, 3000, 5000, 7000, 10000],
            POI_CHECK_TIMEOUT: 5000
        },
        timelines: [] // Array of { id, title, mp3Data, timings, files, binArrayBuffers, audioUrl, assignedPoiIP, assignedPoiLabel, timelineData }
    }
};

/**
 * Get list of POI labels with their IPs
 */
function getPoiList() {
    return [
        { label: 'Main POI', ip: state.poiIPs.mainIP, key: 'mainIP' },
        { label: 'Aux POI', ip: state.poiIPs.auxIP, key: 'auxIP' },
        { label: 'POI 3', ip: state.poiIPs.poiThreeIP, key: 'poiThreeIP' },
        { label: 'POI 4', ip: state.poiIPs.poiFourIP, key: 'poiFourIP' },
        { label: 'POI 5', ip: state.poiIPs.poiFiveIP, key: 'poiFiveIP' },
        { label: 'POI 6', ip: state.poiIPs.poiSixIP, key: 'poiSixIP' },
        { label: 'POI 7', ip: state.poiIPs.poiSevenIP, key: 'poiSevenIP' },
        { label: 'POI 8', ip: state.poiIPs.poiEightIP, key: 'poiEightIP' }
    ];
}

/**
 * Get all configured POIs (no exclusivity - each timeline can select multiple POIs)
 */
function getAvailablePois() {
    const allPois = getPoiList();
    // Show all configured POIs - no exclusivity, each timeline can select multiple
    return allPois.filter(p => p.ip && p.ip !== '0.0.0.0');
}

/**
 * Get assigned POI label for a given IP
 */
function getPoiLabel(ip) {
    const poi = getPoiList().find(p => p.ip === ip);
    return poi ? poi.label : 'Unknown';
}


// State Persistence
function loadState() {
    // Get saved state safely
    let saved = {};
    try {
        const savedString = localStorage.getItem('poiState');
        if (savedString) {
            saved = JSON.parse(savedString);
        }
    } catch (e) {
        console.error('Failed to parse saved state, using defaults', e);
    }

    // Load router mode state - WITH DEFAULTS
    state.poiIPs.routerMode = saved.poiIPs?.routerMode || false;
    state.poiIPs.savedRouterIPs = saved.poiIPs?.savedRouterIPs || {
        main: "192.168.1.1",
        aux: "192.168.1.78",
        three: "0.0.0.0",
        four: "0.0.0.0",
        five: "0.0.0.0",
        six: "0.0.0.0",
        seven: "0.0.0.0",
        eight: "0.0.0.0",
    };

    // Set IPs based on current mode
    if (state.poiIPs.routerMode) {
        state.poiIPs.mainIP = saved.poiIPs?.mainIP || "192.168.1.1";
        state.poiIPs.auxIP = saved.poiIPs?.auxIP || "192.168.1.78";
        state.poiIPs.poiThreeIP = saved.poiIPs?.poiThreeIP || "0.0.0.0";
        state.poiIPs.poiFourIP = saved.poiIPs?.poiFourIP || "0.0.0.0";
        state.poiIPs.poiFiveIP = saved.poiIPs?.poiFiveIP || "0.0.0.0";
        state.poiIPs.poiSixIP = saved.poiIPs?.poiSixIP || "0.0.0.0";
        state.poiIPs.poiSevenIP = saved.poiIPs?.poiSevenIP || "0.0.0.0";
        state.poiIPs.poiEightIP = saved.poiIPs?.poiEightIP || "0.0.0.0";
    } else {
        state.poiIPs.mainIP = "192.168.1.1";
        state.poiIPs.auxIP = "192.168.1.78";
        state.poiIPs.poiThreeIP = saved.poiIPs?.poiThreeIP || "0.0.0.0";
        state.poiIPs.poiFourIP = saved.poiIPs?.poiFourIP || "0.0.0.0";
        state.poiIPs.poiFiveIP = saved.poiIPs?.poiFiveIP || "0.0.0.0";
        state.poiIPs.poiSixIP = saved.poiIPs?.poiSixIP || "0.0.0.0";
        state.poiIPs.poiSevenIP = saved.poiIPs?.poiSevenIP || "0.0.0.0";
        state.poiIPs.poiEightIP = saved.poiIPs?.poiEightIP || "0.0.0.0";
    }

    // Initialize manual IP inputs with current values
    const mainIpInput = document.getElementById('manualMainIp');
    const auxIpInput = document.getElementById('manualAuxIp');
    
    if (mainIpInput) mainIpInput.value = state.poiIPs.mainIP;
    if (mainIpInput) mainIpInput.placeholder = state.poiIPs.mainIP;
    if (auxIpInput) auxIpInput.value = state.poiIPs.auxIP;
    if (auxIpInput) auxIpInput.placeholder = state.poiIPs.auxIP;
    const poiThreeIpInput = document.getElementById('manualPoiThreeIp');
    const poiFourIpInput = document.getElementById('manualPoiFourIp');
    
    if (poiThreeIpInput) poiThreeIpInput.value = state.poiIPs.poiThreeIP;
    if (poiThreeIpInput) poiThreeIpInput.placeholder = state.poiIPs.poiThreeIP;
    if (poiFourIpInput) poiFourIpInput.value = state.poiIPs.poiFourIP;
    if (poiFourIpInput) poiFourIpInput.placeholder = state.poiIPs.poiFourIP;
    
    const poiFiveIpInput = document.getElementById('manualPoiFiveIp');
    const poiSixIpInput = document.getElementById('manualPoiSixIp');
    const poiSevenIpInput = document.getElementById('manualPoiSevenIp');
    const poiEightIpInput = document.getElementById('manualPoiEightIp');
    
    if (poiFiveIpInput) poiFiveIpInput.value = state.poiIPs.poiFiveIP;
    if (poiFiveIpInput) poiFiveIpInput.placeholder = state.poiIPs.poiFiveIP;
    if (poiSixIpInput) poiSixIpInput.value = state.poiIPs.poiSixIP;
    if (poiSixIpInput) poiSixIpInput.placeholder = state.poiIPs.poiSixIP;
    if (poiSevenIpInput) poiSevenIpInput.value = state.poiIPs.poiSevenIP;
    if (poiSevenIpInput) poiSevenIpInput.placeholder = state.poiIPs.poiSevenIP;
    if (poiEightIpInput) poiEightIpInput.value = state.poiIPs.poiEightIP;
    if (poiEightIpInput) poiEightIpInput.placeholder = state.poiIPs.poiEightIP;

    // Update UI elements
    const routerModeCheckbox = document.getElementById('routerModeCheckbox');
    if (routerModeCheckbox) routerModeCheckbox.checked = state.poiIPs.routerMode;
    updateNetworkModeDisplay();
    
    // Handle migration from old wsStrip
    if (saved.wsStrip !== undefined) {
        state.stripType = saved.wsStrip ? "WS2812" : "APA102";
    } else {
        state.stripType = saved.stripType || "WS2812";
    }
    state.customCompression = saved.customCompression || 50;
    
    state.poiIPs = { ...state.poiIPs, ...saved.poiIPs };
    state.settings = { ...state.settings, ...saved.settings };

    // Update Main POI display elements from saved state
    const routerEl = document.getElementById('router');
    const channelEl = document.getElementById('channel');
    const patternEl = document.getElementById('pattern');
    if (routerEl) routerEl.textContent = state.settings.router || 'N/A';
    if (channelEl) channelEl.textContent = state.settings.channel || 'N/A';
    if (patternEl) patternEl.textContent = state.settings.pattern || 'N/A';
    if (state.settings.pixels) updatePixelDisplayForPoi('main', state.settings.pixels);
    
    // Update Aux POI display elements
    const routerTwoEl = document.getElementById('routerTwo');
    const channelTwoEl = document.getElementById('channelTwo');
    const patternTwoEl = document.getElementById('patternTwo');
    if (routerTwoEl) routerTwoEl.textContent = state.settings.routerTwo || 'N/A';
    if (channelTwoEl) channelTwoEl.textContent = state.settings.channelTwo || 'N/A';
    if (patternTwoEl) patternTwoEl.textContent = state.settings.patternTwo || 'N/A';
    if (state.settings.pixelsTwo) updatePixelDisplayForPoi('aux', state.settings.pixelsTwo);

    // Load credentials from saved state
    const routerInput = document.getElementById('routerInput');
    const passwordInput = document.getElementById('passwordInput');
    if (routerInput) routerInput.value = saved.settings?.router || '';
    if (passwordInput) passwordInput.value = saved.settings?.password || '';
    
    // Initialize WS/APA indicator
    updateStripTypeIndicator();
    
    // Update UI elements with persisted state
    // Initialize router IP input
    const routerIpInput = document.getElementById('routerIpInput');
    if (routerIpInput) {
        routerIpInput.placeholder = '192.168.1.1';
        if (state.poiIPs.subnet) {
            routerIpInput.value = state.poiIPs.subnet + "1";
        }
    }
    
    // Update pixel displays using unified function
    updateAllPixelDisplays(state.settings.pixels);
    
    // Update aux POI pixel display if available
    if (state.settings.pixelsTwo !== undefined) {
        updatePixelDisplayForPoi('aux', state.settings.pixelsTwo);
    }
    
    // Load timeline configurations
    if (saved.magicBridge && saved.magicBridge.timelines) {
        state.magicBridge.timelines = saved.magicBridge.timelines.map(t => ({
            ...t,
            // Reset volatile data on load - user must re-select ZIP files
            files: null,
            binArrayBuffers: [],
            audioUrl: null,
            mp3Data: null,
            timelineData: null
        }));
        console.log('[State] Loaded', state.magicBridge.timelines.length, 'timeline configuration(s) from saved state');
        // Rebuild timeline UI if the function exists
        if (typeof rebuildTimelineUI === 'function') {
            setTimeout(rebuildTimelineUI, 100);
        }
    }
}
