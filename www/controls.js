// Controls Tab Functions

// Pattern Handling
window.controlsSubmitPattern = async function(pattern) {
  try {
    await Promise.all([
      fetch(`http://${state.poiIPs.mainIP}/pattern?patternChooserChange=${pattern}`),
      fetch(`http://${state.poiIPs.auxIP}/pattern?patternChooserChange=${pattern}`)
    ]);
    highlightActiveButton(pattern);
    createMessage(`Pattern ${pattern} activated`);
  } catch (error) {
    console.error('Pattern change failed:', error);
    createMessage('Pattern sync failed', 'error');
  }
}

function initializePatternControls() {
  document.querySelectorAll('.pattern-buttons button').forEach(button => {
    button.addEventListener('click', handlePatternSelection);
  });
}

function handlePatternSelection(event) {
    const pattern = event.target.dataset.pattern;
    window.controlsSubmitPattern(pattern);
    highlightActiveButton(pattern);
}

function highlightActiveButton(pattern) {
  document.querySelectorAll('.pattern-buttons button').forEach(btn => {
    if (btn && pattern && pattern >= 1 && pattern <= 7) {
      btn.classList.toggle('active', btn.dataset.pattern === pattern.toString());
    }
  });
}

async function setPatternOnBoth(pattern) {
    if (!state.poiIPs.mainIP || !state.poiIPs.auxIP) {
        createMessage('Configure IP addresses first', 'warning');
        return;
    }
    
    try {
        await Promise.all([
            fetch(`http://${state.poiIPs.mainIP}/pattern?patternChooserChange=${pattern}`),
            fetch(`http://${state.poiIPs.auxIP}/pattern?patternChooserChange=${pattern}`)
        ]);
        createMessage(`Pattern ${pattern} activated`);
    } catch (error) {
        console.error('Pattern change failed:', error);
        createMessage('Pattern change failed - check POI connections', 'error');
        updateStatusIndicators();
    }
}

// Sync Handling
function initializeSync() {
  document.getElementById('syncButton').addEventListener('click', async () => {
    await Promise.all([
      fetch(`http://${state.poiIPs.mainIP}/resetimagetouse`),
      fetch(`http://${state.poiIPs.auxIP}/resetimagetouse`)
    ]);
    createMessage('Both POIs synchronized successfully');
  });
}

// Slider Controls
function initializeSliders() {
    const speedSlider = document.getElementById('speedSlider');
    const brightnessSlider = document.getElementById('brightnessSlider');
    const speedTooltip = document.getElementById('speedTooltip');
    const brightnessTooltip = document.getElementById('brightnessTooltip');

    if (!speedSlider || !brightnessSlider || !speedTooltip || !brightnessTooltip) {
        console.error('Slider elements not found in DOM');
        return;
    }

    // Initialize slider positions from state
    const initialSpeed = valueToSlider(state.settings.speed);
    const initialBrightness = state.settings.brightness;

    speedSlider.value = initialSpeed;
    brightnessSlider.value = initialBrightness;

    // Set initial tooltip values
    speedTooltip.textContent = `${sliderToValue(initialSpeed).toFixed(1)}s`;
    brightnessTooltip.textContent = initialBrightness;

    // Speed Slider
  let speedTimeout;
  speedSlider.addEventListener('input', (e) => {
    const value = sliderToValue(e.target.value);
    speedTooltip.textContent = `${value.toFixed(1)}s`;
    speedTooltip.style.opacity = '1';
    
    // Calculate exact thumb position
    const sliderWidth = speedSlider.offsetWidth;
    const thumbPosition = (e.target.value / speedSlider.max) * sliderWidth;
    speedTooltip.style.left = `${thumbPosition}px`;
    
    // Clear previous timeout and set new one
    clearTimeout(speedTimeout);
    speedTimeout = setTimeout(() => {
      updateBothPOIs(`/intervalChange?interval=${value}`);
    }, 300);
  });

  // Brightness Slider
  let brightnessTimeout;
  brightnessSlider.addEventListener('input', (e) => {
    const value = e.target.value;
    brightnessTooltip.textContent = value;
    brightnessTooltip.style.opacity = '1';
    
    // Calculate exact thumb position
    const sliderWidth = brightnessSlider.offsetWidth;
    const range = brightnessSlider.max - brightnessSlider.min;
    const thumbPosition = ((value - brightnessSlider.min) / range) * sliderWidth;
    brightnessTooltip.style.left = `${thumbPosition}px`;
    
    // Clear previous timeout and set new one
    clearTimeout(brightnessTimeout);
    brightnessTimeout = setTimeout(() => {
      updateBothPOIs(`/brightness?brt=${value}`);
    }, 300);
  });
}

async function updateBothPOIs(endpoint) {
  try {
    await Promise.all([
      fetch(`http://${state.poiIPs.mainIP}${endpoint}`),
      fetch(`http://${state.poiIPs.auxIP}${endpoint}`)
    ]);
    createMessage('Settings updated on both POIs');
  } catch (error) {
    console.error('Error updating POIs:', error);
    createMessage('Error updating settings', 'error');
  }
}

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
            document.getElementById('pixels').textContent = mainData.pixels;

            // Update Aux POI Display
            document.getElementById('routerTwo').textContent = auxData.router;
            const passwordAux = document.getElementById('passwordTwo');
            passwordAux.textContent = '******';
            passwordAux.dataset.actualPassword = auxData.password;
            document.getElementById('channelTwo').textContent = auxData.channel;
            document.getElementById('patternTwo').textContent = auxData.pattern;
            document.getElementById('pixelsTwo').textContent = auxData.pixels;

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
                document.getElementById('pixels').textContent = mainData.pixels || '?';

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
                document.getElementById('pixelsTwo').textContent = state.settings.pixelsTwo || '?';
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
            document.getElementById('pixels').textContent = state.settings.pixels || '?';
            
            // Also update aux POI display to show asterisks
            const passwordAux = document.getElementById('passwordTwo');
            if (passwordAux) {
                passwordAux.textContent = '******';
                passwordAux.dataset.actualPassword = state.settings.passwordTwo;
            }
        }
    });
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

        // Update inputs and placeholders
        mainIpInput.value = state.poiIPs.mainIP;
        mainIpInput.placeholder = state.poiIPs.mainIP;
        auxIpInput.value = state.poiIPs.auxIP;
        auxIpInput.placeholder = state.poiIPs.auxIP;

        saveState();
        updateNetworkModeDisplay();
        createMessage(`Switched to ${routerMode ? 'Router' : 'AP'} mode`);
        updateStatusIndicators();
    } catch (error) {
        console.error('Error updating router mode:', error);
        createMessage('Mode change failed - check POI connections', 'error');
    }
}

function submitChannel() {
    const channelInput = document.getElementById('channelInput');
    const channelValue = parseInt(channelInput.value);

    if (isNaN(channelValue) || channelValue < 1 || channelValue > 13) {
        alert("Invalid channel! WiFi channels must be between 1-13");
        channelInput.value = ""; // Clear invalid input
        return;
    }

    // Handle each request independently
    sendRequest(`http://${state.poiIPs.mainIP}/setting?channel=${channelValue}`)
        .catch(error => console.error('Main Poi channel update failed:', error));
    sendRequest(`http://${state.poiIPs.auxIP}/setting?channel=${channelValue}`)
        .catch(error => console.error('Aux Poi channel update failed:', error));

    setTimeout(() => {
        document.getElementById('fetchBtn').click();
        channelInput.value = "";
    }, 2000);
}

function submitRouter() {
    const routerInput = document.getElementById('routerInput').value;
    const passwordInput = document.getElementById('passwordInput').value;

    // Save to state immediately
    state.settings.router = routerInput;
    state.settings.password = passwordInput;
    saveState();

    // Handle each request independently
    sendRequest(`http://${state.poiIPs.mainIP}/setting?ssid=${routerInput}&pwd=${passwordInput}`)
        .catch(error => console.error('Main Poi router update failed:', error));

    sendRequest(`http://${state.poiIPs.auxIP}/setting?ssid=${routerInput}&pwd=${passwordInput}`)
        .catch(error => console.error('Aux Poi router update failed:', error));

    setTimeout(() => {
        document.getElementById('fetchBtn').click();
        // Preserve the input values after update
        document.getElementById('routerInput').value = routerInput;
        document.getElementById('passwordInput').value = passwordInput;
    }, 2500);
}
// Unified Event Listeners
function initializeEventListeners() {
    document.getElementById('deleteAllButton').addEventListener('click', deleteAllImages);
    document.getElementById('fetchBtn').addEventListener('click', initializeFetchButton);
  // Strip type toggle handler
  document.getElementById('ws_apaBtn').addEventListener('click', toggleStripType);
  document.getElementById('uploadWsApaBtn').addEventListener('click', toggleStripType);

  // Add manual IP handlers
  document.getElementById('manualMainIp').addEventListener('change', setMainIp);
  document.getElementById('manualAuxIp').addEventListener('change', setAuxIp);

  // Add pattern button handlers
  document.querySelectorAll('.pattern-buttons button').forEach(button => {
    button.addEventListener('click', handlePatternSelection);
  });
    // Danger Zone controls
    document.getElementById('routerModeCheckbox').addEventListener('change', submitRouterMode);
    document.getElementById('channelInput').nextElementSibling.addEventListener('click', submitChannel);
    document.querySelector('[onclick="submitRouter()"]').addEventListener('click', submitRouter);

  // Password visibility toggles
  document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', togglePasswordVisibility);
  });
}
function initializeCustomCompressionModal() {
    const modal = document.getElementById('customCompressionModal');
    const slider = document.getElementById('compressionSlider');
    const valueDisplay = document.getElementById('compressionValue');
    const saveBtn = document.getElementById('saveCompressionBtn');
    const closeBtn = document.getElementById('closeCompressionModal');

    // Set initial slider value
    slider.value = state.customCompression;
    valueDisplay.textContent = `${state.customCompression}%`;

    // Update on slider input
    function updateValue() {
        const value = slider.value;
        valueDisplay.textContent = `${value}%`;

        // Auto-save and close when slider changes
        state.customCompression = parseInt(value);
        saveState();
        updateStripTypeIndicator();
        modal.classList.add('hidden');
    }

    // Slider event - auto-save and close on change
    slider.addEventListener('change', updateValue);

    // Save button (for manual save if needed)
    saveBtn.addEventListener('click', () => {
        state.customCompression = parseInt(slider.value);
        saveState();
        updateStripTypeIndicator();
        modal.classList.add('hidden');
    });

    // Close button
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}
function togglePasswordVisibility(event) {
  const container = event.target.closest('.password-container');
  const passwordText = container.querySelector('.password-text');
  const passwordInput = container.querySelector('input[type="password"], input[type="text"]');

  if (passwordText) {
    // Handle span elements
    const currentDisplay = passwordText.textContent;
    const realPassword = passwordText.dataset.actualPassword || 'N/A';

    if (currentDisplay === realPassword || currentDisplay === 'N/A') {
      passwordText.textContent = '******';
    } else {
      passwordText.textContent = realPassword;
    }
  } 
  else if (passwordInput) {
    // Handle input field
    const type = passwordInput.getAttribute('type');
    passwordInput.setAttribute('type', type === 'password' ? 'text' : 'password');
  }
}
function toggleStripType() {
    if (state.stripType === "APA102") {
        state.stripType = "WS2812";
    } else if (state.stripType === "WS2812") {
        state.stripType = "CUSTOM";
        document.getElementById('customCompressionModal').classList.remove('hidden');
    } else {
        state.stripType = "APA102";
    }
    saveState();
    updateStripTypeIndicator();
    createMessage(`Switched to ${state.stripType} mode`);
}