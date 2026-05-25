// Controls Tab Functions
// Create namespace for controls functions (required by main.js wrappers)
window.controls = window.controls || {};


// Pattern Handling
window.controlsSubmitPattern = async function(pattern) {
  try {
    await Promise.all(getPoiIPs().map(ip => 
      fetch(`http://${ip}/pattern?patternChooserChange=${pattern}`)
    ));
    highlightActiveButton(pattern);
    createMessage(`Pattern ${pattern} activated`);
  } catch (error) {
    console.error('Pattern change failed:', error);
    createMessage('Pattern sync failed', 'error');
  }
}

window.submitPattern = window.controlsSubmitPattern;
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
    if (btn && pattern && ((pattern >= 1 && pattern <= 7) || pattern == '70' || pattern == '0')) {
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
        await Promise.all(getPoiIPs().map(ip => 
          fetch(`http://${ip}/pattern?patternChooserChange=${pattern}`)
        ));
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
    await Promise.all(getPoiIPs().map(ip => 
      fetch(`http://${ip}/resetimagetouse`)
    ));
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
    await Promise.all(getPoiIPs().map(ip => 
      fetch(`http://${ip}${endpoint}`)
    ));
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
        
            const fetchPromises = [
                fetchSettings(state.poiIPs.mainIP),
                fetchSettings(state.poiIPs.auxIP)
            ];
            const fetchPoiThree = state.poiIPs.routerMode && state.poiIPs.poiThreeIP && state.poiIPs.poiThreeIP !== '0.0.0.0';
            const fetchPoiFour = state.poiIPs.routerMode && state.poiIPs.poiFourIP && state.poiIPs.poiFourIP !== '0.0.0.0';
            if (fetchPoiThree) fetchPromises.push(fetchSettings(state.poiIPs.poiThreeIP));
            const fetchPoiFive = state.poiIPs.routerMode && state.poiIPs.poiFiveIP && state.poiIPs.poiFiveIP !== '0.0.0.0';
            const fetchPoiSix = state.poiIPs.routerMode && state.poiIPs.poiSixIP && state.poiIPs.poiSixIP !== '0.0.0.0';
            const fetchPoiSeven = state.poiIPs.routerMode && state.poiIPs.poiSevenIP && state.poiIPs.poiSevenIP !== '0.0.0.0';
            const fetchPoiEight = state.poiIPs.routerMode && state.poiIPs.poiEightIP && state.poiIPs.poiEightIP !== '0.0.0.0';
            if (fetchPoiFive) fetchPromises.push(fetchSettings(state.poiIPs.poiFiveIP));
            if (fetchPoiSix) fetchPromises.push(fetchSettings(state.poiIPs.poiSixIP));
            if (fetchPoiSeven) fetchPromises.push(fetchSettings(state.poiIPs.poiSevenIP));
            if (fetchPoiEight) fetchPromises.push(fetchSettings(state.poiIPs.poiEightIP));
            const results = await Promise.all(fetchPromises);
            const mainData = results[0];
            const auxData = results[1];
            const poiThreeData = results[2] || null;
            const poiFourData = results[3] || null;
            const poiFiveData = results[4] || null;
            const poiSixData = results[5] || null;
            const poiSevenData = results[6] || null;
            const poiEightData = results[7] || null;

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

            // Update POI 3 Display
            if (poiThreeData) {
                document.getElementById('routerThree').textContent = poiThreeData.router;
                const passwordThree = document.getElementById('passwordThree');
                if (passwordThree) {
                    passwordThree.textContent = '******';
                    passwordThree.dataset.actualPassword = poiThreeData.password;
                }
                document.getElementById('channelThree').textContent = poiThreeData.channel;
                document.getElementById('patternThree').textContent = poiThreeData.pattern;
                updatePixelDisplayForPoi('three', poiThreeData.pixels);
            }

            // Update POI 4 Display
            if (poiFourData) {
                document.getElementById('routerFour').textContent = poiFourData.router;
                const passwordFour = document.getElementById('passwordFour');
                if (passwordFour) {
                    passwordFour.textContent = '******';
                    passwordFour.dataset.actualPassword = poiFourData.password;
                }
                document.getElementById('channelFour').textContent = poiFourData.channel;
                document.getElementById('patternFour').textContent = poiFourData.pattern;
                updatePixelDisplayForPoi('four', poiFourData.pixels);
            }

            // Update POI 5 Display
            if (poiFiveData) {
                document.getElementById('routerFive').textContent = poiFiveData.router;
                const passwordFive = document.getElementById('passwordFive');
                if (passwordFive) {
                    passwordFive.textContent = '******';
                    passwordFive.dataset.actualPassword = poiFiveData.password;
                }
                document.getElementById('channelFive').textContent = poiFiveData.channel;
                document.getElementById('patternFive').textContent = poiFiveData.pattern;
                updatePixelDisplayForPoi('five', poiFiveData.pixels);
            }

            // Update POI 6 Display
            if (poiSixData) {
                document.getElementById('routerSix').textContent = poiSixData.router;
                const passwordSix = document.getElementById('passwordSix');
                if (passwordSix) {
                    passwordSix.textContent = '******';
                    passwordSix.dataset.actualPassword = poiSixData.password;
                }
                document.getElementById('channelSix').textContent = poiSixData.channel;
                document.getElementById('patternSix').textContent = poiSixData.pattern;
                updatePixelDisplayForPoi('six', poiSixData.pixels);
            }

            // Update POI 7 Display
            if (poiSevenData) {
                document.getElementById('routerSeven').textContent = poiSevenData.router;
                const passwordSeven = document.getElementById('passwordSeven');
                if (passwordSeven) {
                    passwordSeven.textContent = '******';
                    passwordSeven.dataset.actualPassword = poiSevenData.password;
                }
                document.getElementById('channelSeven').textContent = poiSevenData.channel;
                document.getElementById('patternSeven').textContent = poiSevenData.pattern;
                updatePixelDisplayForPoi('seven', poiSevenData.pixels);
            }

            // Update POI 8 Display
            if (poiEightData) {
                document.getElementById('routerEight').textContent = poiEightData.router;
                const passwordEight = document.getElementById('passwordEight');
                if (passwordEight) {
                    passwordEight.textContent = '******';
                    passwordEight.dataset.actualPassword = poiEightData.password;
                }
                document.getElementById('channelEight').textContent = poiEightData.channel;
                document.getElementById('patternEight').textContent = poiEightData.pattern;
                updatePixelDisplayForPoi('eight', poiEightData.pixels);
            }
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

            // Update POI 3 State
            if (poiThreeData) {
                state.settings.routerThree = poiThreeData.router;
                state.settings.passwordThree = poiThreeData.password;
                state.settings.channelThree = poiThreeData.channel;
                state.settings.patternThree = poiThreeData.pattern;
                state.settings.pixelsThree = await fetchNumberOfPixels(state.poiIPs.poiThreeIP);

                document.getElementById('routerThree').textContent = state.settings.routerThree;
                document.getElementById('channelThree').textContent = state.settings.channelThree;
                document.getElementById('patternThree').textContent = state.settings.patternThree;
                updatePixelDisplayForPoi('three', state.settings.pixelsThree || '?');
            }

            // Update POI 4 State
            if (poiFourData) {
                state.settings.routerFour = poiFourData.router;
                state.settings.passwordFour = poiFourData.password;
                state.settings.channelFour = poiFourData.channel;
                state.settings.patternFour = poiFourData.pattern;
                state.settings.pixelsFour = await fetchNumberOfPixels(state.poiIPs.poiFourIP);

                document.getElementById('routerFour').textContent = state.settings.routerFour;
                document.getElementById('channelFour').textContent = state.settings.channelFour;
                document.getElementById('patternFour').textContent = state.settings.patternFour;
                updatePixelDisplayForPoi('four', state.settings.pixelsFour || '?');
            }

            // Update POI 5 State
            if (poiFiveData) {
                state.settings.routerFive = poiFiveData.router;
                state.settings.passwordFive = poiFiveData.password;
                state.settings.channelFive = poiFiveData.channel;
                state.settings.patternFive = poiFiveData.pattern;
                state.settings.pixelsFive = await fetchNumberOfPixels(state.poiIPs.poiFiveIP);

                document.getElementById('routerFive').textContent = state.settings.routerFive;
                document.getElementById('channelFive').textContent = state.settings.channelFive;
                document.getElementById('patternFive').textContent = state.settings.patternFive;
                updatePixelDisplayForPoi('five', state.settings.pixelsFive || '?');
            }

            // Update POI 6 State
            if (poiSixData) {
                state.settings.routerSix = poiSixData.router;
                state.settings.passwordSix = poiSixData.password;
                state.settings.channelSix = poiSixData.channel;
                state.settings.patternSix = poiSixData.pattern;
                state.settings.pixelsSix = await fetchNumberOfPixels(state.poiIPs.poiSixIP);

                document.getElementById('routerSix').textContent = state.settings.routerSix;
                document.getElementById('channelSix').textContent = state.settings.channelSix;
                document.getElementById('patternSix').textContent = state.settings.patternSix;
                updatePixelDisplayForPoi('six', state.settings.pixelsSix || '?');
            }

            // Update POI 7 State
            if (poiSevenData) {
                state.settings.routerSeven = poiSevenData.router;
                state.settings.passwordSeven = poiSevenData.password;
                state.settings.channelSeven = poiSevenData.channel;
                state.settings.patternSeven = poiSevenData.pattern;
                state.settings.pixelsSeven = await fetchNumberOfPixels(state.poiIPs.poiSevenIP);

                document.getElementById('routerSeven').textContent = state.settings.routerSeven;
                document.getElementById('channelSeven').textContent = state.settings.channelSeven;
                document.getElementById('patternSeven').textContent = state.settings.patternSeven;
                updatePixelDisplayForPoi('seven', state.settings.pixelsSeven || '?');
            }

            // Update POI 8 State
            if (poiEightData) {
                state.settings.routerEight = poiEightData.router;
                state.settings.passwordEight = poiEightData.password;
                state.settings.channelEight = poiEightData.channel;
                state.settings.patternEight = poiEightData.pattern;
                state.settings.pixelsEight = await fetchNumberOfPixels(state.poiIPs.poiEightIP);

                document.getElementById('routerEight').textContent = state.settings.routerEight;
                document.getElementById('channelEight').textContent = state.settings.channelEight;
                document.getElementById('patternEight').textContent = state.settings.patternEight;
                updatePixelDisplayForPoi('eight', state.settings.pixelsEight || '?');
            }
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
            
            // Also update POI 3 & 4 display to show asterisks
            const passwordThree = document.getElementById('passwordThree');
            if (passwordThree) {
                passwordThree.textContent = '******';
                passwordThree.dataset.actualPassword = state.settings.passwordThree;
            }
            const passwordFive = document.getElementById('passwordFive');
            if (passwordFive) {
                passwordFive.textContent = '******';
                passwordFive.dataset.actualPassword = state.settings.passwordFive;
            }
            const passwordSix = document.getElementById('passwordSix');
            if (passwordSix) {
                passwordSix.textContent = '******';
                passwordSix.dataset.actualPassword = state.settings.passwordSix;
            }
            const passwordSeven = document.getElementById('passwordSeven');
            if (passwordSeven) {
                passwordSeven.textContent = '******';
                passwordSeven.dataset.actualPassword = state.settings.passwordSeven;
            }
            const passwordEight = document.getElementById('passwordEight');
            if (passwordEight) {
                passwordEight.textContent = '******';
                passwordEight.dataset.actualPassword = state.settings.passwordEight;
            }
            const passwordFour = document.getElementById('passwordFour');
            if (passwordFour) {
                passwordFour.textContent = '******';
                passwordFour.dataset.actualPassword = state.settings.passwordFour;
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

function submitChannel() {
    const channelInput = document.getElementById('channelInput');
    const channelValue = parseInt(channelInput.value);
    
    if (isNaN(channelValue) || channelValue < 1 || channelValue > 13) {
        alert("Invalid channel! WiFi channels must be between 1-13");
        channelInput.value = ""; // Clear invalid input
        return;
    }

    // Handle each request independently - send to all connected POIs
    getPoiIPs().forEach(ip => {
        sendRequest(`http://${ip}/setting?channel=${channelValue}`)
            .catch(error => console.error(`POI ${ip} channel update failed:`, error));
    });

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

    // Handle each request independently - send to all connected POIs
    getPoiIPs().forEach(ip => {
        sendRequest(`http://${ip}/setting?ssid=${routerInput}&pwd=${passwordInput}`)
            .catch(error => console.error(`POI ${ip} router update failed:`, error));
    });

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

// Assign functions to window.controls namespace (required by main.js wrappers)
window.controls.submitChannel = submitChannel;
window.controls.submitRouterMode = submitRouterMode;
window.controls.submitRouter = submitRouter;
window.controls.submitPattern = window.submitPattern;
window.controls.controlsSubmitPattern = window.controlsSubmitPattern;
window.controls.initializePatternControls = initializePatternControls;
window.controls.initializeSync = initializeSync;
window.controls.initializeSliders = initializeSliders;
window.controls.initializeEventListeners = initializeEventListeners;
window.controls.initializeCustomCompressionModal = initializeCustomCompressionModal;
window.controls.togglePasswordVisibility = togglePasswordVisibility;
window.controls.toggleStripType = toggleStripType;