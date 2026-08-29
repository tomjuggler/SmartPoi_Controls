// Network & Discovery Functions

// Detect the router IP for the Discover scan — two sources:
// 1) cordova-plugin-detectrouter (preferred): mirrors the SmartPoi UDP Extras Kotlin
//    detectRouterIp() — finds the hotspot/AP interface IPv4 (swlan0/ap0/wlan1/softap0)
//    when the phone hosts a hotspot, else the WiFi router gateway IPv4 via the default
//    route (only on wlan* interfaces, so carrier gateways are never reported).
// 2) WebRTC RTCPeerConnection "host candidate" trick (fallback when the plugin is
//    unavailable, e.g. desktop/electron): reveals the phone's own local IPv4. The
//    Discover scan derives the /24 from the first 3 octets, so the phone's WiFi IP
//    (e.g. 10.0.0.113) yields the same scan range as the router gateway (10.0.0.2).
function detectRouterIp() {
    return new Promise(function (resolve) {
        var useWebRtcFallback = function () {
            webrtcDetectRouterIp().then(resolve);
        };
        if (window.detectRouter && typeof window.detectRouter.detectRouterIp === 'function') {
            window.detectRouter.detectRouterIp(
                function (ip) { if (ip) { resolve(ip); } else { useWebRtcFallback(); } },
                function () { useWebRtcFallback(); }
            );
        } else {
            useWebRtcFallback();
        }
    });
}

// WebRTC host-candidate local-IP detection (no plugins needed).
function webrtcDetectRouterIp() {
    return new Promise(function (resolve) {
        var ips = [];
        var done = false;
        var pc = null;
        var finish = function () {
            if (done) return;
            done = true;
            try { pc.close(); } catch (e) {}
            // Keep only RFC1918 private IPv4s (10/8, 172.16/12, 192.168/16);
            // exclude CGNAT 100.64/10, link-local 169.254/16 and loopback.
            var priv = ips.filter(function (ip) {
                return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip) &&
                    !/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip) &&
                    !/^169\.254\./.test(ip);
            });
            resolve(priv.length ? priv[0] : null);
        };
        if (typeof RTCPeerConnection === 'undefined') { resolve(null); return; }
        try {
            pc = new RTCPeerConnection({ iceServers: [] });
            pc.createDataChannel('');
            pc.createOffer().then(function (offer) { return pc.setLocalDescription(offer); }).catch(finish);
            pc.onicecandidate = function (e) {
                if (!e.candidate) { finish(); return; }
                var parts = e.candidate.candidate.split(' ');
                if (parts[7] === 'host' && parts[4] && ips.indexOf(parts[4]) === -1) {
                    ips.push(parts[4]);
                }
            };
        } catch (e) {
            finish();
        }
        setTimeout(finish, 3000); // safety timeout in case candidates never fire
    });
}

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
            poiThreeIP: foundDevices[2] || "0.0.0.0",
            poiFourIP: foundDevices[3] || "0.0.0.0",
            poiFiveIP: foundDevices[4] || "0.0.0.0",
            poiSixIP: foundDevices[5] || "0.0.0.0",
            poiSevenIP: foundDevices[6] || "0.0.0.0",
            poiEightIP: foundDevices[7] || "0.0.0.0",
            foundDevices
        };
    } finally {
        if (progressInterval) {
            clearInterval(progressInterval);
        }
    }
}

function initializeNetworkDiscovery() {
    document.getElementById('detectRouterBtn').addEventListener('click', () => {
        detectRouterIp().then(ip => {
            const input = document.getElementById('routerIpInput');
            if (ip) {
                input.value = ip;
                createMessage(`Router IP detected: ${ip} (phone's IP on this network - Discover scans the same subnet)`);
            } else {
                createMessage("Couldn't detect a router IP - enter it manually (hotspot/cellular mode not supported)", 'warning');
            }
        });
    });

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
            const { mainIP, auxIP, poiThreeIP, poiFourIP, poiFiveIP, poiSixIP, poiSevenIP, poiEightIP, foundDevices } = await fastScanNetwork(subnet);
            
            if (foundDevices.length === 0) {
                // No devices found: reset to defaults
                state.poiIPs.mainIP = "192.168.1.1";
                state.poiIPs.auxIP = "192.168.1.78";
                state.poiIPs.poiThreeIP = "0.0.0.0";
                state.poiIPs.poiFourIP = "0.0.0.0";
                state.poiIPs.poiFiveIP = "0.0.0.0";
                state.poiIPs.poiSixIP = "0.0.0.0";
                state.poiIPs.poiSevenIP = "0.0.0.0";
                state.poiIPs.poiEightIP = "0.0.0.0";
            } else {
                // Use the IPs from the scan
                state.poiIPs.mainIP = mainIP;
                state.poiIPs.auxIP = auxIP;
                state.poiIPs.poiThreeIP = poiThreeIP;
                state.poiIPs.poiFourIP = poiFourIP;
                state.poiIPs.poiFiveIP = poiFiveIP;
                state.poiIPs.poiSixIP = poiSixIP;
                state.poiIPs.poiSevenIP = poiSevenIP;
                state.poiIPs.poiEightIP = poiEightIP;
            }
            
            state.poiIPs.routerMode = true;
            saveState();
            updateStatusIndicators();
            updateNetworkModeDisplay();  // Show/hide router-only elements (POI 3-8 inputs)

            // Update UI inputs
            document.getElementById('manualMainIp').value = state.poiIPs.mainIP;
            document.getElementById('manualAuxIp').value = state.poiIPs.auxIP;
            document.getElementById('manualPoiThreeIp').value = state.poiIPs.poiThreeIP;
            document.getElementById('manualPoiFourIp').value = state.poiIPs.poiFourIP;
            document.getElementById('manualPoiFiveIp').value = state.poiIPs.poiFiveIP;
            document.getElementById('manualPoiSixIp').value = state.poiIPs.poiSixIP;
            document.getElementById('manualPoiSevenIp').value = state.poiIPs.poiSevenIP;
            document.getElementById('manualPoiEightIp').value = state.poiIPs.poiEightIP;
        
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
    const mainElement = document.getElementById('mainStatus');
    const auxElement = document.getElementById('auxStatus');
    const poiThreeElement = document.getElementById('poiThreeStatus');
    const poiFourElement = document.getElementById('poiFourStatus');
    const poiFiveElement = document.getElementById('poiFiveStatus');
    const poiSixElement = document.getElementById('poiSixStatus');
    const poiSevenElement = document.getElementById('poiSevenStatus');
    const poiEightElement = document.getElementById('poiEightStatus');
    
    const isRouterMode = state.poiIPs.routerMode;
    const hasPoiThree = isRouterMode && state.poiIPs.poiThreeIP && state.poiIPs.poiThreeIP !== '0.0.0.0';
    const hasPoiFour = isRouterMode && state.poiIPs.poiFourIP && state.poiIPs.poiFourIP !== '0.0.0.0';
    const hasPoiFive = isRouterMode && state.poiIPs.poiFiveIP && state.poiIPs.poiFiveIP !== '0.0.0.0';
    const hasPoiSix = isRouterMode && state.poiIPs.poiSixIP && state.poiIPs.poiSixIP !== '0.0.0.0';
    const hasPoiSeven = isRouterMode && state.poiIPs.poiSevenIP && state.poiIPs.poiSevenIP !== '0.0.0.0';
    const hasPoiEight = isRouterMode && state.poiIPs.poiEightIP && state.poiIPs.poiEightIP !== '0.0.0.0';
    
    // Actual status check
    const checkPromises = [
        checkStatus(state.poiIPs.mainIP),
        checkStatus(state.poiIPs.auxIP)
    ];
    
    if (hasPoiThree) {
        checkPromises.push(checkStatus(state.poiIPs.poiThreeIP));
    } else {
        checkPromises.push(Promise.resolve('offline'));
    }
    if (hasPoiFour) {
        checkPromises.push(checkStatus(state.poiIPs.poiFourIP));
    } else {
        checkPromises.push(Promise.resolve('offline'));
    }
    if (hasPoiFive) {
        checkPromises.push(checkStatus(state.poiIPs.poiFiveIP));
    } else {
        checkPromises.push(Promise.resolve('offline'));
    }
    if (hasPoiSix) {
        checkPromises.push(checkStatus(state.poiIPs.poiSixIP));
    } else {
        checkPromises.push(Promise.resolve('offline'));
    }
    if (hasPoiSeven) {
        checkPromises.push(checkStatus(state.poiIPs.poiSevenIP));
    } else {
        checkPromises.push(Promise.resolve('offline'));
    }
    if (hasPoiEight) {
        checkPromises.push(checkStatus(state.poiIPs.poiEightIP));
    } else {
        checkPromises.push(Promise.resolve('offline'));
    }
    
    Promise.allSettled(checkPromises).then(([mainResult, auxResult, threeResult, fourResult, fiveResult, sixResult, sevenResult, eightResult]) => {
        const mainStatus = mainResult.status === 'fulfilled' ? mainResult.value : 'offline';
        const auxStatus = auxResult.status === 'fulfilled' ? auxResult.value : 'offline';
        const threeStatus = threeResult.status === 'fulfilled' ? threeResult.value : 'offline';
        const fourStatus = fourResult.status === 'fulfilled' ? fourResult.value : 'offline';
        const fiveStatus = fiveResult.status === 'fulfilled' ? fiveResult.value : 'offline';
        const sixStatus = sixResult.status === 'fulfilled' ? sixResult.value : 'offline';
        const sevenStatus = sevenResult.status === 'fulfilled' ? sevenResult.value : 'offline';
        const eightStatus = eightResult.status === 'fulfilled' ? eightResult.value : 'offline';
        
        mainElement.className = `status-indicator ${mainStatus}`;
        mainElement.textContent = `Main POI: ${mainStatus === 'online' ? 'Online' : 'Offline'}`;
        
        auxElement.className = `status-indicator ${auxStatus}`;
        auxElement.textContent = `Aux POI: ${auxStatus === 'online' ? 'Online' : 'Offline'}`;
        
        if (poiThreeElement) {
            poiThreeElement.className = `status-indicator ${threeStatus}`;
            poiThreeElement.textContent = `POI 3: ${threeStatus === 'online' ? 'Online' : 'Offline'}`;
        }
        
        if (poiFourElement) {
            poiFourElement.className = `status-indicator ${fourStatus}`;
            poiFourElement.textContent = `POI 4: ${fourStatus === 'online' ? 'Online' : 'Offline'}`;
        }
        
        if (poiFiveElement) {
            poiFiveElement.className = `status-indicator ${fiveStatus}`;
            poiFiveElement.textContent = `POI 5: ${fiveStatus === 'online' ? 'Online' : 'Offline'}`;
        }
        
        if (poiSixElement) {
            poiSixElement.className = `status-indicator ${sixStatus}`;
            poiSixElement.textContent = `POI 6: ${sixStatus === 'online' ? 'Online' : 'Offline'}`;
        }
        
        if (poiSevenElement) {
            poiSevenElement.className = `status-indicator ${sevenStatus}`;
            poiSevenElement.textContent = `POI 7: ${sevenStatus === 'online' ? 'Online' : 'Offline'}`;
        }
        
        if (poiEightElement) {
            poiEightElement.className = `status-indicator ${eightStatus}`;
            poiEightElement.textContent = `POI 8: ${eightStatus === 'online' ? 'Online' : 'Offline'}`;
        }
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

window.networkSetPoiThreeIp = function() {
    if (!state.poiIPs.routerMode) {
        createMessage('Enable Router Mode first!', 'warning');
        return;
    }
    const ip = document.getElementById('manualPoiThreeIp').value;
    if (validateIP(ip)) {
        state.poiIPs.poiThreeIP = ip;
        saveState();
        createMessage(`POI 3 IP set to ${ip}`);
        updateStatusIndicators();
    } else {
        showError('poiThreeIpError', 'Invalid IP format');
    }
};

window.networkSetPoiFourIp = function() {
    if (!state.poiIPs.routerMode) {
        createMessage('Enable Router Mode first!', 'warning');
        return;
    }
    const ip = document.getElementById('manualPoiFourIp').value;
    if (validateIP(ip)) {
        state.poiIPs.poiFourIP = ip;
        saveState();
        createMessage(`POI 4 IP set to ${ip}`);
        updateStatusIndicators();
    } else {
        showError('poiFourIpError', 'Invalid IP format');
    }
};

window.networkSetPoiFiveIp = function() {
    if (!state.poiIPs.routerMode) {
        createMessage('Enable Router Mode first!', 'warning');
        return;
    }
    const ip = document.getElementById('manualPoiFiveIp').value;
    if (validateIP(ip)) {
        state.poiIPs.poiFiveIP = ip;
        saveState();
        createMessage(`POI 5 IP set to ${ip}`);
        updateStatusIndicators();
    } else {
        showError('poiFiveIpError', 'Invalid IP format');
    }
};

window.networkSetPoiSixIp = function() {
    if (!state.poiIPs.routerMode) {
        createMessage('Enable Router Mode first!', 'warning');
        return;
    }
    const ip = document.getElementById('manualPoiSixIp').value;
    if (validateIP(ip)) {
        state.poiIPs.poiSixIP = ip;
        saveState();
        createMessage(`POI 6 IP set to ${ip}`);
        updateStatusIndicators();
    } else {
        showError('poiSixIpError', 'Invalid IP format');
    }
};

window.networkSetPoiSevenIp = function() {
    if (!state.poiIPs.routerMode) {
        createMessage('Enable Router Mode first!', 'warning');
        return;
    }
    const ip = document.getElementById('manualPoiSevenIp').value;
    if (validateIP(ip)) {
        state.poiIPs.poiSevenIP = ip;
        saveState();
        createMessage(`POI 7 IP set to ${ip}`);
        updateStatusIndicators();
    } else {
        showError('poiSevenIpError', 'Invalid IP format');
    }
};

window.networkSetPoiEightIp = function() {
    if (!state.poiIPs.routerMode) {
        createMessage('Enable Router Mode first!', 'warning');
        return;
    }
    const ip = document.getElementById('manualPoiEightIp').value;
    if (validateIP(ip)) {
        state.poiIPs.poiEightIP = ip;
        saveState();
        createMessage(`POI 8 IP set to ${ip}`);
        updateStatusIndicators();
    } else {
        showError('poiEightIpError', 'Invalid IP format');
    }
};