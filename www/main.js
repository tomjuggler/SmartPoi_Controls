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

function setPoiThreeIp() {
    if (typeof window.networkSetPoiThreeIp === 'function') {
        window.networkSetPoiThreeIp();
    }
}

function setPoiFourIp() {
    if (typeof window.networkSetPoiFourIp === 'function') {
        window.networkSetPoiFourIp();
    }
}

function setPoiFiveIp() {
    if (typeof window.networkSetPoiFiveIp === 'function') {
        window.networkSetPoiFiveIp();
    }
}

function setPoiSixIp() {
    if (typeof window.networkSetPoiSixIp === 'function') {
        window.networkSetPoiSixIp();
    }
}

function setPoiSevenIp() {
    if (typeof window.networkSetPoiSevenIp === 'function') {
        window.networkSetPoiSevenIp();
    }
}

function setPoiEightIp() {
    if (typeof window.networkSetPoiEightIp === 'function') {
        window.networkSetPoiEightIp();
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

            
            // Fetch and update POI 3-8 settings if in router mode
            if (state.poiIPs.routerMode && state.poiIPs.poiThreeIP && state.poiIPs.poiThreeIP !== '0.0.0.0') {
                const threeData = await fetchSettings(state.poiIPs.poiThreeIP);
                if (threeData) {
                    state.settings.routerThree = threeData.router;
                    state.settings.passwordThree = threeData.password;
                    state.settings.channelThree = threeData.channel;
                    state.settings.patternThree = threeData.pattern;
                    state.settings.pixelsThree = await fetchNumberOfPixels(state.poiIPs.poiThreeIP);
                    document.getElementById('routerThree').textContent = state.settings.routerThree;
                    document.getElementById('channelThree').textContent = state.settings.channelThree;
                    document.getElementById('patternThree').textContent = state.settings.patternThree;
                    updatePixelDisplayForPoi('three', state.settings.pixelsThree || '?');
                }
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiFourIP && state.poiIPs.poiFourIP !== '0.0.0.0') {
                const fourData = await fetchSettings(state.poiIPs.poiFourIP);
                if (fourData) {
                    state.settings.routerFour = fourData.router;
                    state.settings.passwordFour = fourData.password;
                    state.settings.channelFour = fourData.channel;
                    state.settings.patternFour = fourData.pattern;
                    state.settings.pixelsFour = await fetchNumberOfPixels(state.poiIPs.poiFourIP);
                    document.getElementById('routerFour').textContent = state.settings.routerFour;
                    document.getElementById('channelFour').textContent = state.settings.channelFour;
                    document.getElementById('patternFour').textContent = state.settings.patternFour;
                    updatePixelDisplayForPoi('four', state.settings.pixelsFour || '?');
                }
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiFiveIP && state.poiIPs.poiFiveIP !== '0.0.0.0') {
                const fiveData = await fetchSettings(state.poiIPs.poiFiveIP);
                if (fiveData) {
                    state.settings.routerFive = fiveData.router;
                    state.settings.passwordFive = fiveData.password;
                    state.settings.channelFive = fiveData.channel;
                    state.settings.patternFive = fiveData.pattern;
                    state.settings.pixelsFive = await fetchNumberOfPixels(state.poiIPs.poiFiveIP);
                    document.getElementById('routerFive').textContent = state.settings.routerFive;
                    document.getElementById('channelFive').textContent = state.settings.channelFive;
                    document.getElementById('patternFive').textContent = state.settings.patternFive;
                    updatePixelDisplayForPoi('five', state.settings.pixelsFive || '?');
                }
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiSixIP && state.poiIPs.poiSixIP !== '0.0.0.0') {
                const sixData = await fetchSettings(state.poiIPs.poiSixIP);
                if (sixData) {
                    state.settings.routerSix = sixData.router;
                    state.settings.passwordSix = sixData.password;
                    state.settings.channelSix = sixData.channel;
                    state.settings.patternSix = sixData.pattern;
                    state.settings.pixelsSix = await fetchNumberOfPixels(state.poiIPs.poiSixIP);
                    document.getElementById('routerSix').textContent = state.settings.routerSix;
                    document.getElementById('channelSix').textContent = state.settings.channelSix;
                    document.getElementById('patternSix').textContent = state.settings.patternSix;
                    updatePixelDisplayForPoi('six', state.settings.pixelsSix || '?');
                }
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiSevenIP && state.poiIPs.poiSevenIP !== '0.0.0.0') {
                const sevenData = await fetchSettings(state.poiIPs.poiSevenIP);
                if (sevenData) {
                    state.settings.routerSeven = sevenData.router;
                    state.settings.passwordSeven = sevenData.password;
                    state.settings.channelSeven = sevenData.channel;
                    state.settings.patternSeven = sevenData.pattern;
                    state.settings.pixelsSeven = await fetchNumberOfPixels(state.poiIPs.poiSevenIP);
                    document.getElementById('routerSeven').textContent = state.settings.routerSeven;
                    document.getElementById('channelSeven').textContent = state.settings.channelSeven;
                    document.getElementById('patternSeven').textContent = state.settings.patternSeven;
                    updatePixelDisplayForPoi('seven', state.settings.pixelsSeven || '?');
                }
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiEightIP && state.poiIPs.poiEightIP !== '0.0.0.0') {
                const eightData = await fetchSettings(state.poiIPs.poiEightIP);
                if (eightData) {
                    state.settings.routerEight = eightData.router;
                    state.settings.passwordEight = eightData.password;
                    state.settings.channelEight = eightData.channel;
                    state.settings.patternEight = eightData.pattern;
                    state.settings.pixelsEight = await fetchNumberOfPixels(state.poiIPs.poiEightIP);
                    document.getElementById('routerEight').textContent = state.settings.routerEight;
                    document.getElementById('channelEight').textContent = state.settings.channelEight;
                    document.getElementById('patternEight').textContent = state.settings.patternEight;
                    updatePixelDisplayForPoi('eight', state.settings.pixelsEight || '?');
                }
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
            
            // Fetch and update POI 3-8 settings if in router mode
            if (state.poiIPs.routerMode && state.poiIPs.poiThreeIP && state.poiIPs.poiThreeIP !== '0.0.0.0') {
                const threeData = await fetchSettings(state.poiIPs.poiThreeIP);
                if (threeData) {
                    state.settings.routerThree = threeData.router;
                    state.settings.passwordThree = threeData.password;
                    state.settings.channelThree = threeData.channel;
                    state.settings.patternThree = threeData.pattern;
                    state.settings.pixelsThree = await fetchNumberOfPixels(state.poiIPs.poiThreeIP);
                    
                    document.getElementById('routerThree').textContent = state.settings.routerThree;
                    document.getElementById('channelThree').textContent = state.settings.channelThree;
                    document.getElementById('patternThree').textContent = state.settings.patternThree;
                    updatePixelDisplayForPoi('three', state.settings.pixelsThree || '?');
                }
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiFourIP && state.poiIPs.poiFourIP !== '0.0.0.0') {
                const fourData = await fetchSettings(state.poiIPs.poiFourIP);
                if (fourData) {
                    state.settings.routerFour = fourData.router;
                    state.settings.passwordFour = fourData.password;
                    state.settings.channelFour = fourData.channel;
                    state.settings.patternFour = fourData.pattern;
                    state.settings.pixelsFour = await fetchNumberOfPixels(state.poiIPs.poiFourIP);
                    
                    document.getElementById('routerFour').textContent = state.settings.routerFour;
                    document.getElementById('channelFour').textContent = state.settings.channelFour;
                    document.getElementById('patternFour').textContent = state.settings.patternFour;
                    updatePixelDisplayForPoi('four', state.settings.pixelsFour || '?');
                }
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiFiveIP && state.poiIPs.poiFiveIP !== '0.0.0.0') {
                const fiveData = await fetchSettings(state.poiIPs.poiFiveIP);
                if (fiveData) {
                    state.settings.routerFive = fiveData.router;
                    state.settings.passwordFive = fiveData.password;
                    state.settings.channelFive = fiveData.channel;
                    state.settings.patternFive = fiveData.pattern;
                    state.settings.pixelsFive = await fetchNumberOfPixels(state.poiIPs.poiFiveIP);
                    
                    document.getElementById('routerFive').textContent = state.settings.routerFive;
                    document.getElementById('channelFive').textContent = state.settings.channelFive;
                    document.getElementById('patternFive').textContent = state.settings.patternFive;
                    updatePixelDisplayForPoi('five', state.settings.pixelsFive || '?');
                }
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiSixIP && state.poiIPs.poiSixIP !== '0.0.0.0') {
                const sixData = await fetchSettings(state.poiIPs.poiSixIP);
                if (sixData) {
                    state.settings.routerSix = sixData.router;
                    state.settings.passwordSix = sixData.password;
                    state.settings.channelSix = sixData.channel;
                    state.settings.patternSix = sixData.pattern;
                    state.settings.pixelsSix = await fetchNumberOfPixels(state.poiIPs.poiSixIP);
                    
                    document.getElementById('routerSix').textContent = state.settings.routerSix;
                    document.getElementById('channelSix').textContent = state.settings.channelSix;
                    document.getElementById('patternSix').textContent = state.settings.patternSix;
                    updatePixelDisplayForPoi('six', state.settings.pixelsSix || '?');
                }
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiSevenIP && state.poiIPs.poiSevenIP !== '0.0.0.0') {
                const sevenData = await fetchSettings(state.poiIPs.poiSevenIP);
                if (sevenData) {
                    state.settings.routerSeven = sevenData.router;
                    state.settings.passwordSeven = sevenData.password;
                    state.settings.channelSeven = sevenData.channel;
                    state.settings.patternSeven = sevenData.pattern;
                    state.settings.pixelsSeven = await fetchNumberOfPixels(state.poiIPs.poiSevenIP);
                    
                    document.getElementById('routerSeven').textContent = state.settings.routerSeven;
                    document.getElementById('channelSeven').textContent = state.settings.channelSeven;
                    document.getElementById('patternSeven').textContent = state.settings.patternSeven;
                    updatePixelDisplayForPoi('seven', state.settings.pixelsSeven || '?');
                }
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiEightIP && state.poiIPs.poiEightIP !== '0.0.0.0') {
                const eightData = await fetchSettings(state.poiIPs.poiEightIP);
                if (eightData) {
                    state.settings.routerEight = eightData.router;
                    state.settings.passwordEight = eightData.password;
                    state.settings.channelEight = eightData.channel;
                    state.settings.patternEight = eightData.pattern;
                    state.settings.pixelsEight = await fetchNumberOfPixels(state.poiIPs.poiEightIP);
                    
                    document.getElementById('routerEight').textContent = state.settings.routerEight;
                    document.getElementById('channelEight').textContent = state.settings.channelEight;
                    document.getElementById('patternEight').textContent = state.settings.patternEight;
                    updatePixelDisplayForPoi('eight', state.settings.pixelsEight || '?');
                }
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
            
            // Fallback display for POI 3-8 if in router mode
            if (state.poiIPs.routerMode && state.poiIPs.poiThreeIP && state.poiIPs.poiThreeIP !== '0.0.0.0') {
                document.getElementById('routerThree').textContent = state.settings.routerThree || 'N/A';
                const pw3 = document.getElementById('passwordThree');
                if (pw3) { pw3.textContent = '******'; pw3.dataset.actualPassword = state.settings.passwordThree || ''; }
                document.getElementById('channelThree').textContent = state.settings.channelThree || 'N/A';
                document.getElementById('patternThree').textContent = state.settings.patternThree || 'N/A';
                updatePixelDisplayForPoi('three', state.settings.pixelsThree || '?');
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiFourIP && state.poiIPs.poiFourIP !== '0.0.0.0') {
                document.getElementById('routerFour').textContent = state.settings.routerFour || 'N/A';
                const pw4 = document.getElementById('passwordFour');
                if (pw4) { pw4.textContent = '******'; pw4.dataset.actualPassword = state.settings.passwordFour || ''; }
                document.getElementById('channelFour').textContent = state.settings.channelFour || 'N/A';
                document.getElementById('patternFour').textContent = state.settings.patternFour || 'N/A';
                updatePixelDisplayForPoi('four', state.settings.pixelsFour || '?');
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiFiveIP && state.poiIPs.poiFiveIP !== '0.0.0.0') {
                document.getElementById('routerFive').textContent = state.settings.routerFive || 'N/A';
                const pw5 = document.getElementById('passwordFive');
                if (pw5) { pw5.textContent = '******'; pw5.dataset.actualPassword = state.settings.passwordFive || ''; }
                document.getElementById('channelFive').textContent = state.settings.channelFive || 'N/A';
                document.getElementById('patternFive').textContent = state.settings.patternFive || 'N/A';
                updatePixelDisplayForPoi('five', state.settings.pixelsFive || '?');
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiSixIP && state.poiIPs.poiSixIP !== '0.0.0.0') {
                document.getElementById('routerSix').textContent = state.settings.routerSix || 'N/A';
                const pw6 = document.getElementById('passwordSix');
                if (pw6) { pw6.textContent = '******'; pw6.dataset.actualPassword = state.settings.passwordSix || ''; }
                document.getElementById('channelSix').textContent = state.settings.channelSix || 'N/A';
                document.getElementById('patternSix').textContent = state.settings.patternSix || 'N/A';
                updatePixelDisplayForPoi('six', state.settings.pixelsSix || '?');
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiSevenIP && state.poiIPs.poiSevenIP !== '0.0.0.0') {
                document.getElementById('routerSeven').textContent = state.settings.routerSeven || 'N/A';
                const pw7 = document.getElementById('passwordSeven');
                if (pw7) { pw7.textContent = '******'; pw7.dataset.actualPassword = state.settings.passwordSeven || ''; }
                document.getElementById('channelSeven').textContent = state.settings.channelSeven || 'N/A';
                document.getElementById('patternSeven').textContent = state.settings.patternSeven || 'N/A';
                updatePixelDisplayForPoi('seven', state.settings.pixelsSeven || '?');
            }
            if (state.poiIPs.routerMode && state.poiIPs.poiEightIP && state.poiIPs.poiEightIP !== '0.0.0.0') {
                document.getElementById('routerEight').textContent = state.settings.routerEight || 'N/A';
                const pw8 = document.getElementById('passwordEight');
                if (pw8) { pw8.textContent = '******'; pw8.dataset.actualPassword = state.settings.passwordEight || ''; }
                document.getElementById('channelEight').textContent = state.settings.channelEight || 'N/A';
                document.getElementById('patternEight').textContent = state.settings.patternEight || 'N/A';
                updatePixelDisplayForPoi('eight', state.settings.pixelsEight || '?');
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

        // Delete from all POIs
        await Promise.all([
            deleteFromPoi(state.poiIPs.mainIP, filenames),
            deleteFromPoi(state.poiIPs.auxIP, filenames),
            deleteFromPoi(state.poiIPs.poiThreeIP, filenames),
            deleteFromPoi(state.poiIPs.poiFourIP, filenames),
            deleteFromPoi(state.poiIPs.poiFiveIP, filenames),
            deleteFromPoi(state.poiIPs.poiSixIP, filenames),
            deleteFromPoi(state.poiIPs.poiSevenIP, filenames),
            deleteFromPoi(state.poiIPs.poiEightIP, filenames)
        ]);
        
        createMessage('All images deleted from all POIs');
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


// Tab swipe detection
const TAB_ORDER = ['controls', 'images', 'upload', 'text', 'files', 'about', 'magic-bridge'];

function switchToTab(tabName) {
    // Find button for this tab
    const button = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    if (button) {
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(btn => 
            btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update tab content
        state.currentTab = tabName;
        document.querySelectorAll('.tab-content').forEach(content => 
            content.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        
        // Load content if needed
        loadTabContent(tabName);
    }
}

function handleSwipeLeft() {
    const currentIndex = TAB_ORDER.indexOf(state.currentTab);
    if (currentIndex < TAB_ORDER.length - 1) {
        switchToTab(TAB_ORDER[currentIndex + 1]);
    }
}

function handleSwipeRight() {
    const currentIndex = TAB_ORDER.indexOf(state.currentTab);
    if (currentIndex > 0) {
        switchToTab(TAB_ORDER[currentIndex - 1]);
    }
}

function setupSwipeDetection() {
    console.log('Setting up swipe detection');
    
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouching = false;
    const SWIPE_THRESHOLD = 50;
    
    // Add event listeners to the whole document
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchCancel);
    
    function handleTouchStart(e) {
        // Skip if touching a button or input
        const tag = e.target.tagName;
        if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
            return;
        }
        
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        isTouching = true;
        console.log('Touch started at:', touchStartX, touchStartY);
    }
    
    function handleTouchMove(e) {
        if (!isTouching) return;
        
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        
        // If horizontal movement is dominant, prevent default to stop scrolling
        if (deltaX > deltaY && deltaX > 10) {
            e.preventDefault();
        }
    }
    
    function handleTouchEnd(e) {
        if (!isTouching) return;
        
        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = Math.abs(touchEndY - touchStartY);
        
        console.log(`Touch ended: deltaX=${deltaX}, deltaY=${deltaY}`);
        
        // Check if it's a horizontal swipe
        if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > SWIPE_THRESHOLD) {
            console.log(`Swipe detected: ${deltaX > 0 ? 'RIGHT' : 'LEFT'} (${Math.abs(deltaX)}px)`);
            
            if (deltaX > 0) {
                handleSwipeRight();
            } else {
                handleSwipeLeft();
            }
            
            e.preventDefault();
        }
        
        isTouching = false;
    }
    
    function handleTouchCancel() {
        isTouching = false;
    }
}

// Tab management
function setupTabNavigation() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            switchToTab(button.dataset.tab);
        });
    });
}

// Load text tab content
async function loadTextTabContent() {
    const textTab = document.getElementById('text');
    if (!textTab) return;
    
    // Content is already inlined in index.html, just initialize TextTab module
    if (typeof TextTab !== 'undefined' && typeof TextTab.init === 'function') {
        TextTab.init();
    } else {
        console.warn('TextTab module not available');
        // Show error message if TextTab is not available
        const statusElement = document.getElementById('upload-status');
        if (statusElement) {
            statusElement.innerHTML = '<div class="error-message">Text tab functionality not available. Please refresh the page.</div>';
        }
    }
}

// Load tab-specific content
function loadTabContent(tabName) {
    if (tabName === 'controls') {
        initializePatternControls();
        initializeSync();
    } else if (tabName === 'images') {
        setupImageHandlers();
        refreshAllImages();
    } else if (tabName === 'text') {
        // Load and initialize text tab
        loadTextTabContent();
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
        // Update all POIs first
        await Promise.all(getPoiIPs().map(ip =>
            fetch(`http://${ip}/router?router=${routerMode ? 1 : 0}`)
        ));

        // Update local state
        state.poiIPs.routerMode = routerMode;
        
        const mainIpInput = document.getElementById('manualMainIp');
        const auxIpInput = document.getElementById('manualAuxIp');
        const poiThreeIpInput = document.getElementById('manualPoiThreeIp');
        const poiFourIpInput = document.getElementById('manualPoiFourIp');
        const poiFiveIpInput = document.getElementById('manualPoiFiveIp');
        const poiSixIpInput = document.getElementById('manualPoiSixIp');
        const poiSevenIpInput = document.getElementById('manualPoiSevenIp');
        const poiEightIpInput = document.getElementById('manualPoiEightIp');
        
        if (routerMode) {
            // Restore saved router mode IPs
            state.poiIPs.mainIP = state.poiIPs.savedRouterIPs.main || "192.168.1.1";
            state.poiIPs.auxIP = state.poiIPs.savedRouterIPs.aux || "192.168.1.78";
            state.poiIPs.poiThreeIP = state.poiIPs.savedRouterIPs.three || "0.0.0.0";
            state.poiIPs.poiFourIP = state.poiIPs.savedRouterIPs.four || "0.0.0.0";
            state.poiIPs.poiFiveIP = state.poiIPs.savedRouterIPs.five || "0.0.0.0";
            state.poiIPs.poiSixIP = state.poiIPs.savedRouterIPs.six || "0.0.0.0";
            state.poiIPs.poiSevenIP = state.poiIPs.savedRouterIPs.seven || "0.0.0.0";
            state.poiIPs.poiEightIP = state.poiIPs.savedRouterIPs.eight || "0.0.0.0";
        } else {
            // Save current IPs before switching to AP mode
            state.poiIPs.savedRouterIPs = {
                main: state.poiIPs.mainIP,
                aux: state.poiIPs.auxIP,
                three: state.poiIPs.poiThreeIP,
                four: state.poiIPs.poiFourIP,
                five: state.poiIPs.poiFiveIP,
                six: state.poiIPs.poiSixIP,
                seven: state.poiIPs.poiSevenIP,
                eight: state.poiIPs.poiEightIP
            };
            // Set hardcoded AP mode IPs
            state.poiIPs.mainIP = "192.168.1.1";
            state.poiIPs.auxIP = "192.168.1.78";
            state.poiIPs.poiThreeIP = "0.0.0.0";
            state.poiIPs.poiFourIP = "0.0.0.0";
            state.poiIPs.poiFiveIP = "0.0.0.0";
            state.poiIPs.poiSixIP = "0.0.0.0";
            state.poiIPs.poiSevenIP = "0.0.0.0";
            state.poiIPs.poiEightIP = "0.0.0.0";
        }

        // Update inputs and placeholders
        mainIpInput.value = state.poiIPs.mainIP;
        mainIpInput.placeholder = state.poiIPs.mainIP;
        auxIpInput.value = state.poiIPs.auxIP;
        auxIpInput.placeholder = state.poiIPs.auxIP;
        if (poiThreeIpInput) {
            poiThreeIpInput.value = state.poiIPs.poiThreeIP;
            poiThreeIpInput.placeholder = state.poiIPs.poiThreeIP;
        }
        if (poiFourIpInput) {
            poiFourIpInput.value = state.poiIPs.poiFourIP;
            poiFourIpInput.placeholder = state.poiIPs.poiFourIP;
        }
        if (poiFiveIpInput) {
            poiFiveIpInput.value = state.poiIPs.poiFiveIP;
            poiFiveIpInput.placeholder = state.poiIPs.poiFiveIP;
        }
        if (poiSixIpInput) {
            poiSixIpInput.value = state.poiIPs.poiSixIP;
            poiSixIpInput.placeholder = state.poiIPs.poiSixIP;
        }
        if (poiSevenIpInput) {
            poiSevenIpInput.value = state.poiIPs.poiSevenIP;
            poiSevenIpInput.placeholder = state.poiIPs.poiSevenIP;
        }
        if (poiEightIpInput) {
            poiEightIpInput.value = state.poiIPs.poiEightIP;
            poiEightIpInput.placeholder = state.poiIPs.poiEightIP;
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
    setupSwipeDetection();
    initializeNetworkDiscovery();
    try {
        setupImageHandlers();
    } catch(e) {
        console.warn('setupImageHandlers failed:', e);
    }
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
    try {
        setupImageHandlers();
    } catch(e) {
        console.warn('setupImageHandlers failed:', e);
    }

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