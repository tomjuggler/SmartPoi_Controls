// Network & Discovery Functions

// Fast POI Discovery Functions
async function checkDevice(ip) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`http://${ip}/poi-available`, {
            method: 'GET',
            signal: controller.signal,
            mode: 'cors',
            redirect: 'error'
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const text = await response.text();
            return { ip, status: text };
        }
    } catch (error) {
        // Device not found or error
    }
    return null;
}

async function fastScanNetwork(subnet) {
    const totalIPs = 254;
    let foundDevices = [];
    let completedCount = 0;
    
    // Create progress interval
    const progressInterval = setInterval(() => {
        document.getElementById('currentIP').textContent = completedCount;
    }, 100);
    
    // Create all requests concurrently
    const checkPromises = [];
    for (let i = 1; i <= totalIPs; i++) {
        const ip = `${subnet}${i}`;
        const promise = checkDevice(ip).then(result => {
            completedCount++;
            return result;
        });
        checkPromises.push(promise);
    }
    
    try {
        // Wait for all checks to complete
        const results = await Promise.allSettled(checkPromises);
        
        // Process results
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value !== null) {
                foundDevices.push(result.value.ip);
            }
        });
        
        // Return the first two devices found (if any)
        return {
            mainIP: foundDevices[0] || state.poiIPs.mainIP,
            auxIP: foundDevices[1] || state.poiIPs.auxIP,
            foundDevices
        };
    } finally {
        if (progressInterval) {
            clearInterval(progressInterval);
        }
    }
}

function initializeNetworkDiscovery() {
    document.getElementById('discoverBtn').addEventListener('click', async () => {
        const routerIp = document.getElementById('routerIpInput').value;
        if (!validateIP(routerIp)) {
            showError('ipError', 'Invalid IP address format!');
            return;
        }

        const octets = routerIp.split('.').slice(0, 3);
        const subnet = octets.join('.') + '.';
        state.poiIPs.subnet = subnet;

        showLoadingState(true);
        
        try {
            const { mainIP, auxIP, foundDevices } = await fastScanNetwork(subnet);
            
            if (foundDevices.length === 0) {
                // No devices found: reset to defaults
                state.poiIPs.mainIP = "192.168.1.1";
                state.poiIPs.auxIP = "192.168.1.78";
            } else {
                // Use the IPs from the scan
                state.poiIPs.mainIP = mainIP;
                state.poiIPs.auxIP = auxIP;
            }
            
            state.poiIPs.routerMode = true;
            saveState();
            updateStatusIndicators();

            // Update UI inputs
            document.getElementById('manualMainIp').value = state.poiIPs.mainIP;
            document.getElementById('manualAuxIp').value = state.poiIPs.auxIP;
        
            if (foundDevices.length > 0) {
                createMessage(`Discovered ${foundDevices.length} POI(s): ${foundDevices.join(', ')}`);
            } else {
                createMessage('No POIs found - using default IPs', 'warning');
            }
        } catch (error) {
            showError('ipError', 'Scanning failed');
            createMessage('Discovery error: ' + error.message, 'error');
        } finally {
            showLoadingState(false);
        }
    });
}

// Status Check Functions
function initializeStatusCheck() {
    // First update: set to checking immediately
    updateStatusIndicators();
    
    // Second update after 2 seconds
    setTimeout(updateStatusIndicators, 2000);
    
    // Third update after 5 seconds
    setTimeout(updateStatusIndicators, 5000);
    
    // Periodic checks every 10 seconds
    setInterval(updateStatusIndicators, 10000);
    
    // Also update when tab becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateStatusIndicators();
    });
}

function checkStatus(ip) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500); // Shorter timeout
    
    return fetch(`http://${ip}/get-pixels`, {
        signal: controller.signal,
        mode: 'cors',
        redirect: 'error'
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) return 'offline';
        return response.text().then(text => {
            // Verify we actually got pixel data
            const pixels = parseInt(text, 10);
            return !isNaN(pixels) && pixels > 0 ? 'online' : 'offline';
        });
    })
    .catch(error => {
        clearTimeout(timeoutId);
        return 'offline';
    });
}

function updateStatusIndicators() {
    // Set initial state to checking
    const mainElement = document.getElementById('mainStatus');
    const auxElement = document.getElementById('auxStatus');
    
    if (!mainElement.classList.contains('online') && 
        !mainElement.classList.contains('offline')) {
        mainElement.className = 'status-indicator';
        mainElement.textContent = 'Main POI: Checking...';
        auxElement.className = 'status-indicator';
        auxElement.textContent = 'Aux POI: Checking...';
    }

    // Actual status check
    Promise.allSettled([
        checkStatus(state.poiIPs.mainIP),
        checkStatus(state.poiIPs.auxIP)
    ]).then(([mainResult, auxResult]) => {
        const mainStatus = mainResult.status === 'fulfilled' ? mainResult.value : 'offline';
        const auxStatus = auxResult.status === 'fulfilled' ? auxResult.value : 'offline';

        mainElement.className = `status-indicator ${mainStatus}`;
        mainElement.textContent = `Main POI: ${mainStatus === 'online' ? 'Online' : 'Offline'}`;
        
        auxElement.className = `status-indicator ${auxStatus}`;
        auxElement.textContent = `Aux POI: ${auxStatus === 'online' ? 'Online' : 'Offline'}`;
    });
}

// IP Setting Functions
window.networkSetMainIp = function() {
    if (!state.poiIPs.routerMode) {
        createMessage('Enable Router Mode first!', 'warning');
        return;
    }
    const ip = document.getElementById('manualMainIp').value;
    if (validateIP(ip)) {
        state.poiIPs.mainIP = ip;
        saveState();
        createMessage(`Main IP set to ${ip}`);
        updateStatusIndicators();
    } else {
        showError('mainIpError', 'Invalid IP format');
    }
}

window.networkSetAuxIp = function() {
    if (!state.poiIPs.routerMode) {
        createMessage('Enable Router Mode first!', 'warning');
        return;
    }
    const ip = document.getElementById('manualAuxIp').value;
    if (validateIP(ip)) {
        state.poiIPs.auxIP = ip;
        saveState();
        createMessage(`Aux IP set to ${ip}`);
        updateStatusIndicators();
    } else {
        showError('auxIpError', 'Invalid IP format');
    }
}