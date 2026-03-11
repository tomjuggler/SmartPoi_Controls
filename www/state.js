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
        routerMode: false,
        subnet: "",
        savedRouterIPs: {
            main: "",
            aux: ""
        }
    },
    currentTab: "controls",
    patterns: {
        current: 1,
        available: 7
    },
    images: {
        main: [],
        aux: []
    },
    settings: {
        pixels: 120,
        brightness: 20,
        speed: 0.5,
        stripType: "WS2812"
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
        }
    }
};

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
        aux: "192.168.1.78"
    };

    // Set IPs based on current mode
    if (state.poiIPs.routerMode) {
        state.poiIPs.mainIP = saved.poiIPs?.mainIP || "192.168.1.1";
        state.poiIPs.auxIP = saved.poiIPs?.auxIP || "192.168.1.78";
    } else {
        state.poiIPs.mainIP = "192.168.1.1";
        state.poiIPs.auxIP = "192.168.1.78";
    }

    // Initialize manual IP inputs with current values
    const mainIpInput = document.getElementById('manualMainIp');
    const auxIpInput = document.getElementById('manualAuxIp');
    
    if (mainIpInput) mainIpInput.value = state.poiIPs.mainIP;
    if (mainIpInput) mainIpInput.placeholder = state.poiIPs.mainIP;
    if (auxIpInput) auxIpInput.value = state.poiIPs.auxIP;
    if (auxIpInput) auxIpInput.placeholder = state.poiIPs.auxIP;

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
}
