// Main Application Entry Point
// This file handles core initialization and orchestrates all modular functionality

// Global functions needed for onclick handlers
function setMainIp() {
    if (typeof window.networkSetMainIp === 'function') {
        window.networkSetMainIp();
    }
}

function setAuxIp() {
    if (typeof window.networkSetAuxIp === 'function') {
        window.networkSetAuxIp();
    }
}


function submitRouterMode() {
    if (typeof window.controls && typeof window.controls.submitRouterMode === 'function') {
        window.controls.submitRouterMode();
    }
}

function submitChannel() {
    if (typeof window.controls && typeof window.controls.submitChannel === 'function') {
        window.controls.submitChannel();
    }
}

function getFilesAndDisplay() {
    if (typeof window.images && typeof window.images.getFilesAndDisplay === 'function') {
        window.images.getFilesAndDisplay();
    }
}

function getFilesOne() {
    if (typeof window.images && typeof window.images.getFilesOne === 'function') {
        window.images.getFilesOne();
    }
}

function getFilesTwo() {
    if (typeof window.images && typeof window.images.getFilesTwo === 'function') {
        window.images.getFilesTwo();
    }
}




async function fetchSettings(ip) {
    try {
        // Preserve existing credentials if available
        const currentRouter = document.getElementById('routerInput').value || state.settings.router;
        const currentPassword = document.getElementById('passwordInput').value || state.settings.password;

        const response = await fetch(`http://${ip}/returnsettings`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.text();
        const parts = data.split(',').map(p => p.trim());
        
        // Get fresh pixel count from dedicated endpoint
        const pixels = await fetchNumberOfPixels(ip);
        
        return {
            router: parts[0] || currentRouter,
            password: parts[1] || currentPassword,
            channel: parts[2] || 'N/A',
            pattern: parts[parts.length - 1] || 'N/A',
            pixels: pixels || '?'
        };
    } catch (error) {
        console.error('Fetch settings failed:', error);
        return {
            router: 'N/A',
            password: 'N/A',
            channel: 'N/A',
            pattern: 'N/A',
            pixels: '?'
        };
    }
    
    // Try to get pixels separately to avoid failing entire request
    try {
        baseFields.pixels = await fetchNumberOfPixels(ip);
    } catch (error) {
        console.error('Failed to fetch pixels:', error);
        baseFields.pixels = '?';
    }
    
    return baseFields;
}
// Slider conversion functions
function sliderToValue(sliderPercent) {
    if (sliderPercent <= 50) {
        return 0.5 + Math.floor((sliderPercent / 50) * 60) * 0.5;
    }
    return 30 * Math.pow(1800 / 30, (sliderPercent - 50) / 50);
}

function valueToSlider(value) {
    if (value <= 30) {
        return ((value - 0.5) / 29.5) * 50 * (30 / 29.5);
    }
    return 50 + (Math.log(value / 30) / Math.log(60)) * 50;
}

// Modal Dialog Functions
// Fetch Button Handler
function initializeFetchButton() {
    document.getElementById('fetchBtn').addEventListener('click', async () => {
        try {
            // Preserve existing input values
            const currentRouter = document.getElementById('routerInput').value;
            const currentPassword = document.getElementById('passwordInput').value;

            createMessage('Fetching settings...', 'info');
        
            const [mainData, auxData] = await Promise.all([
                fetchSettings(state.poiIPs.mainIP),
                fetchSettings(state.poiIPs.auxIP)
            ]);

            // Update Main POI Display
            document.getElementById('router').textContent = mainData.router;
            const passwordMain = document.getElementById('password');
            passwordMain.textContent = '******';
            passwordMain.dataset.actualPassword = mainData.password;
            document.getElementById('channel').textContent = mainData.channel;
            document.getElementById('pattern').textContent = mainData.pattern;
            updatePixelDisplayForPoi('main', mainData.pixels);

            // Update Aux POI Display
            document.getElementById('routerTwo').textContent = auxData.router;
            const passwordAux = document.getElementById('passwordTwo');
            passwordAux.textContent = '******';
            passwordAux.dataset.actualPassword = auxData.password;
            document.getElementById('channelTwo').textContent = auxData.channel;
            document.getElementById('patternTwo').textContent = auxData.pattern;
            updatePixelDisplayForPoi('aux', auxData.pixels);

            // Restore inputs if they were cleared
            document.getElementById('routerInput').value = currentRouter || mainData.router;
            document.getElementById('passwordInput').value = currentPassword || mainData.password;

            // Update state with preserved values
            state.settings.router = document.getElementById('routerInput').value;
            state.settings.password = document.getElementById('passwordInput').value;
            saveState();

            // Update Main POI display
            // Update Main POI
            if (mainData) {
                // Direct DOM updates first
                document.getElementById('router').textContent = mainData.router;
                document.getElementById('channel').textContent = mainData.channel;
                document.getElementById('pattern').textContent = mainData.pattern;
                updatePixelDisplayForPoi('main', mainData.pixels || '?');

                // Then update state
                state.settings.router = mainData.router;
                state.settings.password = mainData.password;
                state.settings.channel = mainData.channel;
                state.settings.pattern = mainData.pattern;
                state.settings.pixels = await fetchNumberOfPixels(state.poiIPs.mainIP);
                
                // Update input placeholders
                document.getElementById('routerInput').placeholder = state.settings.router;
                document.getElementById('passwordInput').placeholder = state.settings.password;
            }

            // Update Aux POI 
            if (auxData) {
                state.settings.routerTwo = auxData.router;
                state.settings.passwordTwo = auxData.password;
                state.settings.channelTwo = auxData.channel;
                state.settings.patternTwo = auxData.pattern;
                state.settings.pixelsTwo = await fetchNumberOfPixels(state.poiIPs.auxIP);

                document.getElementById('routerTwo').textContent = state.settings.routerTwo;
                document.getElementById('channelTwo').textContent = state.settings.channelTwo;
                document.getElementById('patternTwo').textContent = state.settings.patternTwo;
                updatePixelDisplayForPoi('aux', state.settings.pixelsTwo || '?');
            }
            highlightActiveButton(mainData.pattern);
            // Force UI refresh
            saveState();
            updateStatusIndicators();
            createMessage('Settings updated successfully');
            highlightActiveButton(state.settings.pattern);

        } catch (error) {
            console.error('Fetch error:', error);
            createMessage('Failed to fetch settings - check POI connections', 'error');
            updateStatusIndicators();
            // Update UI with cached state on error
            document.getElementById('router').textContent = state.settings.router;
            const passwordMain = document.getElementById('password');
            passwordMain.textContent = '******';
            passwordMain.dataset.actualPassword = state.settings.password;
            document.getElementById('channel').textContent = state.settings.channel;
            document.getElementById('pattern').textContent = state.settings.pattern;
            updatePixelDisplayForPoi('main', state.settings.pixels || '?');
            
            // Also update aux POI display to show asterisks
            const passwordAux = document.getElementById('passwordTwo');
            if (passwordAux) {
                passwordAux.textContent = '******';
                passwordAux.dataset.actualPassword = state.settings.passwordTwo;
            }
        }
    });
}

function initializeModal() {
    // Add click handlers to image wrappers (not individual images)
    document.addEventListener('click', (e) => {
        const wrapper = e.target.closest('.image-wrapper');
        if (wrapper) {
            const img = wrapper.querySelector('.poi-image');
            if (img && img.src) {
                showModal(img.src);
            }
        }
    });

    // Close modal when clicking anywhere on the overlay
    document.querySelector('.modal-overlay').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            document.querySelector('.modal-overlay').classList.add('hidden');
        }
    });
}

function showModal(imageSrc) {
    const modal = document.querySelector('.modal-overlay');
    const modalImg = modal.querySelector('.modal-image');
    modalImg.src = imageSrc;
    modal.querySelector('.filename').textContent = imageSrc.split('/').pop();
    modal.classList.remove('hidden');
}

async function deleteImage(imageUrl) {
    try {
        const response = await fetch(imageUrl, { method: 'DELETE' });
        if (!response.ok) throw new Error('Delete failed');
        createMessage('Image deleted successfully');
    } catch (error) {
        console.error('Delete error:', error);
        createMessage('Failed to delete image', 'error');
    }
}

async function deleteAllImages() {
    if (!confirm('WARNING: This will delete ALL images from both POIs!')) return;
    
    try {
        // Generate all possible image filenames
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const filenames = Array.from(characters).map(c => `${c}.bin`);

        // Delete from both POIs
        await Promise.all([
            deleteFromPoi(state.poiIPs.mainIP, filenames),
            deleteFromPoi(state.poiIPs.auxIP, filenames)
        ]);
        
        createMessage('All images deleted from both POIs');
        refreshAllImages(true);
    } catch (error) {
        console.error('Delete all failed:', error);
        createMessage('Failed to delete all images', 'error');
    }
}

async function deleteFromPoi(ip, filenames) {
    return Promise.all(filenames.map(fileName => 
        fetch(`http://${ip}/edit?path=/${fileName}`, {
            method: 'DELETE'
        })
    ));
}

// File List Functions
async function getFileList() {
    try {
        const response = await fetch(`http://${state.poiIPs.mainIP}/list?dir=/`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.text();
        document.getElementById('fileListTextArea').value = data;
        createMessage('Main POI files fetched successfully');
    } catch (error) {
        console.error('Error fetching main files:', error);
        createMessage('Failed to fetch main files', 'error');
    }
}

async function getFileListTwo() {
    try {
        const response = await fetch(`http://${state.poiIPs.auxIP}/list?dir=/`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.text();
        document.getElementById('fileListTextAreatwo').value = data;
        createMessage('Aux POI files fetched successfully');
    } catch (error) {
        console.error('Error fetching aux files:', error);
        createMessage('Failed to fetch aux files', 'error');
    }
}


// Tab management
function setupTabNavigation() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            // Update active tab button
            document.querySelectorAll('.tab-button').forEach(btn => 
                btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update tab content
            state.currentTab = button.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(content => 
                content.classList.remove('active'));
            document.getElementById(state.currentTab).classList.add('active');
            
            // Load content if needed
            loadTabContent(state.currentTab);
        });
    });
}

// Load tab-specific content
function loadTabContent(tabName) {
    if (tabName === 'controls') {
        initializePatternControls();
        initializeSync();
    } else if (tabName === 'images') {
        setupImageHandlers();
        refreshAllImages();
    } else if (tabName === 'files') {
        // Initialize any list-specific functionality
    }
}

// State management
function loadPersistedState() {
    const savedState = JSON.parse(localStorage.getItem('poiState'));
    if (savedState) {
        Object.assign(state, savedState);
    }
}

function savePersistedState() {
    localStorage.setItem('poiState', JSON.stringify({
        poiOneIP: state.poiOneIP,
        poiTwoIP: state.poiTwoIP,
        routerMode: state.routerMode,
        numberOfPixels: state.numberOfPixels,
        wsStrip: state.wsStrip
    }));
}

// Danger Zone Functions
async function submitRouterMode() {
    const routerMode = document.getElementById('routerModeCheckbox').checked;
    
    try {
        // Update both POIs first
        await Promise.all([
            fetch(`http://${state.poiIPs.mainIP}/router?router=${routerMode ? 1 : 0}`),
            fetch(`http://${state.poiIPs.auxIP}/router?router=${routerMode ? 1 : 0}`)
        ]);

        // Update local state
        state.poiIPs.routerMode = routerMode;
        
        const mainIpInput = document.getElementById('manualMainIp');
        const auxIpInput = document.getElementById('manualAuxIp');
        
        if (routerMode) {
            // Restore saved router mode IPs
            state.poiIPs.mainIP = state.poiIPs.savedRouterIPs.main || "192.168.1.1";
            state.poiIPs.auxIP = state.poiIPs.savedRouterIPs.aux || "192.168.1.78";
        } else {
            // Save current IPs before switching to AP mode
            state.poiIPs.savedRouterIPs = {
                main: state.poiIPs.mainIP,
                aux: state.poiIPs.auxIP
            };
            // Set hardcoded AP mode IPs
            state.poiIPs.mainIP = "192.168.1.1";
            state.poiIPs.auxIP = "192.168.1.78";
        }

        saveState();
        updateNetworkModeDisplay();
        createMessage(`Switched to ${routerMode ? 'Router' : 'AP'} mode`);
        updateStatusIndicators();
    } catch (error) {
        console.error('Error updating router mode:', error);
        createMessage('Mode change failed - check POI connections', 'error');
    }
}

// Initialize App
function init() {
    loadState();
    initializeUploadHandlers();
    setupTabNavigation();
    initializeNetworkDiscovery();
    setupImageHandlers();
    initializeModal();
    initializeEventListeners();
    initializeSliders();
    initializeStatusCheck();
    fetchInitialPixels();
    refreshAllImages();
    initializeFetchButton();
    initializeCustomCompressionModal();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const savedIPs = JSON.parse(localStorage.getItem('poiIPs') || '{}');

    if (savedIPs.routerMode) {
        document.getElementById('routerModeCheckbox').checked = true;
        state.poiIPs.mainIP = savedIPs.mainIP || "192.168.1.1";
        state.poiIPs.auxIP = savedIPs.auxIP || "192.168.1.78";
    }

    init();
    initializePatternControls();
    initializeSync();
    setupImageHandlers();

    // Initialize sliders after DOM is ready
    setTimeout(() => {
        initializeSliders();
    }, 100);

    // Initialize slider positions from state
    const speedSlider = document.getElementById('speedSlider');
    const brightnessSlider = document.getElementById('brightnessSlider');
    speedSlider.value = valueToSlider(state.settings.speed);
    brightnessSlider.value = state.settings.brightness;

    // Ensure network mode display is updated
    updateNetworkModeDisplay();

    // Initialize magic bridge upload button
    document.getElementById('magic-bridge-upload').addEventListener('click', toggleMagicBridgeUpload);
    // Initialize clear button
    document.getElementById('magic-bridge-clear').addEventListener('click', clearUpload);
    // Show clear button when file selected
    document.getElementById('zip-input').addEventListener('change', () => {
        const clearBtn = document.getElementById('magic-bridge-clear');
        const hasFile = document.getElementById('zip-input').files[0];
        clearBtn.style.display = hasFile ? 'inline-block' : 'none';
        
        // Reset UI for new file selection
        if (hasFile) {
            // Hide file list from previous upload
            document.getElementById('file-list').style.display = 'none';
            // Clear status message
            const statusEl = document.getElementById('upload-status-standalone');
            statusEl.textContent = '';
            // Reset button text if not currently uploading
            if (!uploadInProgress) {
                const uploadBtn = document.getElementById('magic-bridge-upload');
                uploadBtn.textContent = 'Upload to POI';
            }
        }
    });
});