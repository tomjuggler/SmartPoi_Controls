// Text Tab JavaScript - Canvas Text Rendering with Font Loading

// TextTab module for encapsulating functionality
const TextTab = (function() {
    // Module state
    const state = {
        canvas: null,
        ctx: null,
        selectedColor: '#ff0000',
        aspectRatio: 1.5, // Default to 3:2
        fontLoaded: false,
        fontLoading: false,
        currentText: '',
        canvasHeight: 120,
        fontName: 'CustomFont'
    };
    
    // DOM elements cache
    const elements = {};
    
    // Initialize module
    function init() {
        cacheElements();
        setupCanvas();
        setupEventListeners();
        loadFont();
        updateCanvasDimensions();
    }
    
    // Cache DOM elements
    function cacheElements() {
        elements.textInput = document.getElementById('text-input');
        elements.heightInput = document.getElementById('height-input');
        elements.colorPicker = document.getElementById('color-picker');
        elements.canvas = document.getElementById('textCanvas');
        elements.generateBtn = document.getElementById('generate-btn');
        elements.uploadBtn = document.getElementById('upload-btn');
        elements.ratioButtons = document.querySelectorAll('.ratio-btn');
        elements.colorSwatches = document.querySelectorAll('.color-swatch');
        elements.canvasDimensions = document.getElementById('canvas-dimensions');
        elements.fontStatus = document.getElementById('font-status');
        elements.filenameInput = document.getElementById('filename-input');
        elements.filenameSuggestions = document.querySelectorAll('.filename-suggestion');
        elements.poiButtons = document.querySelectorAll('.poi-btn');
        elements.uploadStatus = document.getElementById('upload-status');
    }
    
    // Setup canvas context
    function setupCanvas() {
        if (!elements.canvas) return;
        
        state.canvas = elements.canvas;
        state.ctx = state.canvas.getContext('2d');
        
        // Set initial canvas dimensions
        updateCanvasDimensions();
        
        // Draw initial placeholder
        drawPlaceholder();
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Text input
        if (elements.textInput) {
            elements.textInput.addEventListener('input', handleTextInput);
        }
        
        // Height input
        if (elements.heightInput) {
            elements.heightInput.addEventListener('input', handleHeightInput);
        }
        
        // Color picker
        if (elements.colorPicker) {
            elements.colorPicker.addEventListener('input', handleColorPicker);
        }
        
        // Generate button
        if (elements.generateBtn) {
            elements.generateBtn.addEventListener('click', handleGenerate);
        }
        
        // Upload button
        if (elements.uploadBtn) {
            elements.uploadBtn.addEventListener('click', handleUpload);
        }
        
        // Ratio buttons
        elements.ratioButtons.forEach(button => {
            button.addEventListener('click', handleRatioButton);
        });
        
        // Color swatches
        elements.colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', handleColorSwatch);
        });
        
        // Filename suggestions
        elements.filenameSuggestions.forEach(suggestion => {
            suggestion.addEventListener('click', handleFilenameSuggestion);
        });
        
        // POI selection buttons
        elements.poiButtons.forEach(button => {
            button.addEventListener('click', handlePoiButton);
        });
    }
    
    // Load custom font
    function loadFont() {
        if (state.fontLoading || state.fontLoaded) return;
        
        state.fontLoading = true;
        updateFontStatus('Loading font...');
        
        const font = new FontFace(state.fontName, 'url(./font.otf)');
        
        font.load()
            .then(function(loadedFont) {
                document.fonts.add(loadedFont);
                state.fontLoaded = true;
                state.fontLoading = false;
                updateFontStatus('Font loaded ✓');
                
                // Redraw if there's text
                if (state.currentText) {
                    renderText();
                }
            })
            .catch(function(error) {
                console.error('Font loading error:', error);
                state.fontLoaded = false;
                state.fontLoading = false;
                updateFontStatus('Using system font');
                
                // Fallback to system font
                state.fontName = 'Arial, sans-serif';
                
                // Redraw if there's text
                if (state.currentText) {
                    renderText();
                }
            });
    }
    
    // Update font status display
    function updateFontStatus(message) {
        if (elements.fontStatus) {
            elements.fontStatus.textContent = `Font: ${message}`;
        }
    }
    
    // Update canvas dimensions display
    function updateCanvasDimensions() {
        if (elements.canvasDimensions && state.canvas) {
            elements.canvasDimensions.textContent = 
                `${state.canvas.width}×${state.canvas.height} pixels`;
        }
    }
    
    // Handle text input
    function handleTextInput(event) {
        state.currentText = event.target.value.trim();
        
        // Auto-generate if text is entered
        if (state.currentText && state.fontLoaded) {
            renderText();
        } else if (!state.currentText) {
            drawPlaceholder();
        }
    }
    
    // Handle height input
    function handleHeightInput(event) {
        const newHeight = Math.min(256, Math.max(36, parseInt(event.target.value) || 120));
        state.canvasHeight = newHeight;
        updateCanvasDimensions();
        renderText();
    }
    
    // Handle color picker
    function handleColorPicker(event) {
        state.selectedColor = event.target.value;
        
        // Update active color swatch
        elements.colorSwatches.forEach(swatch => {
            swatch.classList.remove('active');
            if (swatch.dataset.color === state.selectedColor) {
                swatch.classList.add('active');
            }
        });
        
        // Redraw if there's text
        if (state.currentText) {
            renderText();
        }
    }
    
    // Handle color swatch click
    function handleColorSwatch(event) {
        const color = event.currentTarget.dataset.color;
        state.selectedColor = color;
        
        // Update color picker
        if (elements.colorPicker) {
            elements.colorPicker.value = color;
        }
        
        // Update swatch states
        elements.colorSwatches.forEach(swatch => {
            swatch.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Redraw if there's text
        if (state.currentText) {
            renderText();
        }
    }
    
    // Handle ratio button click
    function handleRatioButton(event) {
        state.aspectRatio = parseFloat(event.currentTarget.dataset.ratio);
        
        // Update button states
        elements.ratioButtons.forEach(button => {
            button.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Update canvas dimensions
        updateCanvasDimensions();
        
        // Redraw if there's text
        if (state.currentText) {
            renderText();
        }
    }
    
    // Handle generate button click
    function handleGenerate() {
        state.currentText = elements.textInput.value.trim();
        
        if (!state.currentText) {
            showStatus('Please enter some text', 'warning');
            return;
        }
        
        renderText();
        enableUploadButton();
        showStatus('Text rendered successfully', 'success');
    }
    
    // Handle upload button click
    async function handleUpload() {
        // Validate we have text rendered
        if (!state.currentText || !state.canvas) {
            showStatus('Please generate text first', 'warning');
            return;
        }
        
        // Get selected filename and validate
        const filename = getSelectedFilename();
        if (!filename || !filename.trim()) {
            showStatus('Please enter a filename', 'warning');
            return;
        }
        
        // Validate filename format (should match upload.js validation)
        const filenameRegex = /^[a-zA-Z0-9-_.]{1,50}\.bin$/i;
        if (!filenameRegex.test(filename)) {
            showStatus('Filename must be 1-50 characters, contain only letters, numbers, hyphens, underscores, or dots, and end with .bin', 'warning');
            return;
        }
        
        // Get selected POI
        const selectedPoi = getSelectedPoi();
        
        // Disable upload button during process
        disableUploadButton();
        showStatus('Preparing upload...', 'info');
        
        try {
            // Convert canvas to File object
            const file = await getCanvasAsFile(filename);
            
            // Get POI IPs from global state
            const mainIp = state?.poiIPs?.mainIP || '192.168.1.1';
            const auxIp = state?.poiIPs?.auxIP || '192.168.1.78';
            
            // Determine which POIs to upload to
            const uploadToMain = selectedPoi === 'main' || selectedPoi === 'both';
            const uploadToAux = selectedPoi === 'aux' || selectedPoi === 'both';
            
            // Collect target IPs
            const targetIps = [];
            if (uploadToMain && mainIp) targetIps.push({ip: mainIp, name: 'Main POI'});
            if (uploadToAux && auxIp) targetIps.push({ip: auxIp, name: 'Aux POI'});
            
            if (targetIps.length === 0) {
                throw new Error('No POI IP addresses configured');
            }
            
            // Upload to all target POIs
            let successCount = 0;
            let errorCount = 0;
            
            for (const target of targetIps) {
                try {
                    showStatus(`Uploading to ${target.name}...`, 'info');
                    
                    // Store original pattern and turn off LEDs for upload
                    let originalPattern;
                    try {
                        const response = await fetch(`http://${target.ip}/returnsettings`);
                        if (response.ok) {
                            const data = await response.text();
                            const parts = data.split(',');
                            originalPattern = parts[parts.length - 1].trim();
                        } else {
                            originalPattern = 1; // Default fallback
                        }
                        
                        await fetch(`http://${target.ip}/pattern?patternChooserChange=7`);
                        await delay(500); // Allow flash write cycle
                    } catch (error) {
                        console.error('Error preparing for upload:', error);
                        showStatus(`Failed to initialize upload to ${target.name}`, 'error');
                        errorCount++;
                        continue;
                    }
                    
                    try {
                        // Process canvas image through the same pipeline as image uploads
                        const binaryData = await processImageFile(file);
                        
                        const formData = new FormData();
                        formData.append('file', new Blob([binaryData], {
                            type: 'application/octet-stream'
                        }), filename);
                        
                        // Add timeout to upload request
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                        
                        const response = await fetch(`http://${target.ip}/edit`, {
                            method: 'POST',
                            body: formData,
                            signal: controller.signal
                        });
                        
                        clearTimeout(timeoutId);
                        
                        if (!response.ok) {
                            throw new Error(`Upload failed: ${response.statusText}`);
                        }
                        
                        successCount++;
                        showStatus(`Uploaded to ${target.name} ✓`, 'success');
                        
                    } catch (uploadError) {
                        console.error(`Upload failed for ${target.name}:`, uploadError);
                        errorCount++;
                        showStatus(`Failed to upload to ${target.name}: ${uploadError.message}`, 'error');
                    } finally {
                        // Restore original pattern
                        try {
                            await fetch(`http://${target.ip}/pattern?patternChooserChange=${originalPattern || 1}`);
                            await delay(500); // Allow flash write cycle
                        } catch (restoreError) {
                            console.error('Failed to restore pattern:', restoreError);
                        }
                    }
                    
                } catch (error) {
                    console.error(`Upload failed for ${target.name}:`, error);
                    errorCount++;
                    showStatus(`Failed to upload to ${target.name}: ${error.message}`, 'error');
                }
            }
            
            // Show final status
            if (successCount > 0 && errorCount === 0) {
                showStatus(`Text uploaded successfully to ${successCount} POI(s)!`, 'success');
            } else if (successCount > 0 && errorCount > 0) {
                showStatus(`Uploaded to ${successCount} POI(s), failed for ${errorCount} POI(s)`, 'warning');
            } else {
                throw new Error('Upload failed for all POIs');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            showStatus(`Upload failed: ${error.message}`, 'error');
        } finally {
            // Re-enable upload button
            enableUploadButton();
        }
    }
    
    // Handle filename suggestion click
    function handleFilenameSuggestion(event) {
        const filename = event.currentTarget.dataset.filename;
        if (elements.filenameInput) {
            elements.filenameInput.value = filename;
        }
    }
    
    // Handle POI button click
    function handlePoiButton(event) {
        const poi = event.currentTarget.dataset.poi;
        
        // Update button states
        elements.poiButtons.forEach(button => {
            button.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        
        // Update connection status (to be implemented)
        updatePoiStatus(poi);
    }
    
    // Update POI status with actual connection check
    async function updatePoiStatus(poi) {
        const statusElement = document.getElementById('text-poi-status');
        if (!statusElement) return;
        
        // Get IPs from global state
        const mainIp = state?.poiIPs?.mainIP || '192.168.1.1';
        const auxIp = state?.poiIPs?.auxIP || '192.168.1.78';
        
        // Show checking status
        statusElement.textContent = 'Checking...';
        statusElement.className = 'status-indicator';
        
        try {
            if (poi === 'both') {
                // Check both POIs
                const [mainStatus, auxStatus] = await Promise.allSettled([
                    checkPoiConnection(mainIp),
                    checkPoiConnection(auxIp)
                ]);
                
                const mainConnected = mainStatus.status === 'fulfilled' && mainStatus.value;
                const auxConnected = auxStatus.status === 'fulfilled' && auxStatus.value;
                
                if (mainConnected && auxConnected) {
                    statusElement.textContent = 'Both POIs Connected';
                    statusElement.className = 'status-indicator online';
                } else if (mainConnected || auxConnected) {
                    statusElement.textContent = 'One POI Connected';
                    statusElement.className = 'status-indicator warning';
                } else {
                    statusElement.textContent = 'Both POIs Offline';
                    statusElement.className = 'status-indicator offline';
                }
            } else {
                // Check single POI
                let targetIp;
                if (poi === 'main') {
                    targetIp = mainIp;
                } else if (poi === 'aux') {
                    targetIp = auxIp;
                }
                
                if (!targetIp) {
                    statusElement.textContent = 'No IP configured';
                    statusElement.className = 'status-indicator offline';
                    return;
                }
                
                const isConnected = await checkPoiConnection(targetIp);
                
                if (isConnected) {
                    statusElement.textContent = 'Connected';
                    statusElement.className = 'status-indicator online';
                } else {
                    statusElement.textContent = 'Offline';
                    statusElement.className = 'status-indicator offline';
                }
            }
        } catch (error) {
            console.error(`Connection check failed for ${poi} POI(s):`, error);
            statusElement.textContent = 'Check Failed';
            statusElement.className = 'status-indicator offline';
        }
    }
    
    // Helper function to check POI connection
    async function checkPoiConnection(ip) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`http://${ip}/get-pixels`, {
                signal: controller.signal,
                method: 'GET'
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    // Disable upload button
    function disableUploadButton() {
        if (elements.uploadBtn) {
            elements.uploadBtn.disabled = true;
        }
    }
    
    // Enable upload button
    function enableUploadButton() {
        if (elements.uploadBtn) {
            elements.uploadBtn.disabled = false;
        }
    }
    
    // Simple delay function
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Show status message
    function showStatus(message, type = 'info') {
        if (elements.uploadStatus) {
            elements.uploadStatus.textContent = message;
            elements.uploadStatus.className = `upload-status ${type}`;
            
            // Clear after 5 seconds for non-error messages
            if (type !== 'error') {
                setTimeout(() => {
                    if (elements.uploadStatus.textContent === message) {
                        elements.uploadStatus.textContent = '';
                        elements.uploadStatus.className = 'upload-status';
                    }
                }, 5000);
            }
        }
    }
    
    // Draw placeholder on canvas
    function drawPlaceholder() {
        if (!state.ctx || !state.canvas) return;
        
        const ctx = state.ctx;
        const width = state.canvas.width;
        const height = state.canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // Draw placeholder text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Enter text above to preview', width / 2, height / 2);
        
        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
    }
    
    // Render text to canvas
    function renderText() {
        if (!state.ctx || !state.canvas || !state.currentText) {
            drawPlaceholder();
            return;
        }
        
        // Update canvas dimensions
        state.canvas.height = state.canvasHeight;
        state.canvas.width = Math.round(state.canvasHeight * state.aspectRatio);
        
        const ctx = state.ctx;
        const width = state.canvas.width;
        const height = state.canvas.height;
        const text = state.currentText;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // Set font
        const fontSize = calculateOptimalFontSize(text, width, height);
        ctx.font = `${fontSize}px ${state.fontName}`;
        ctx.fillStyle = state.selectedColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Wrap text
        const lines = wrapText(ctx, text, width - 20);
        
        // Calculate vertical position
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = (height - totalHeight) / 2;
        
        // Draw each line
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], width / 2, startY + (i * lineHeight));
        }
        
        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        
        // Update dimensions display
        updateCanvasDimensions();
    }
    
    // Calculate optimal font size for given text and canvas dimensions
    function calculateOptimalFontSize(text, maxWidth, maxHeight) {
        const minFontSize = 10;
        const maxFontSize = 100;
        const ctx = state.ctx;
        
        // Test font sizes from large to small
        for (let size = maxFontSize; size >= minFontSize; size--) {
            ctx.font = `${size}px ${state.fontName}`;
            const lines = wrapText(ctx, text, maxWidth - 20);
            const lineHeight = size * 1.2;
            const totalHeight = lines.length * lineHeight;
            
            // Check if text fits
            let fits = true;
            for (const line of lines) {
                if (ctx.measureText(line).width > maxWidth - 20) {
                    fits = false;
                    break;
                }
            }
            
            if (fits && totalHeight <= maxHeight - 20) {
                return size;
            }
        }
        
        // If no size fits, return minimum
        return minFontSize;
    }
    
    // Wrap text into multiple lines
    function wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width <= maxWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        // Handle case where a single word is too long
        if (lines.length === 0 && text.length > 0) {
            // Break long word
            let tempLine = '';
            for (let i = 0; i < text.length; i++) {
                const testChar = tempLine + text[i];
                if (ctx.measureText(testChar).width > maxWidth) {
                    lines.push(tempLine);
                    tempLine = text[i];
                } else {
                    tempLine = testChar;
                }
            }
            if (tempLine) {
                lines.push(tempLine);
            }
        }
        
        return lines;
    }
    
    // Get canvas as File object (for upload)
    function getCanvasAsFile(filename = 'text-image.png') {
        return new Promise((resolve, reject) => {
            if (!state.canvas) {
                reject(new Error('Canvas not available'));
                return;
            }
            
            state.canvas.toBlob(function(blob) {
                if (!blob) {
                    reject(new Error('Canvas to blob conversion failed'));
                    return;
                }
                
                const file = new File([blob], filename, {
                    type: 'image/png',
                    lastModified: Date.now()
                });
                
                resolve(file);
            }, 'image/png');
        });
    }
    
    // Get current canvas dimensions
    function getCanvasDimensions() {
        if (!state.canvas) return { width: 0, height: 0 };
        return {
            width: state.canvas.width,
            height: state.canvas.height
        };
    }
    
    // Get current text
    function getCurrentText() {
        return state.currentText;
    }
    
    // Get selected color
    function getSelectedColor() {
        return state.selectedColor;
    }
    
    // Get selected filename
    function getSelectedFilename() {
        if (elements.filenameInput) {
            return elements.filenameInput.value.trim();
        }
        return 'a.bin';
    }
    
    // Get selected POI
    function getSelectedPoi() {
        const activeButton = document.querySelector('.poi-btn.active');
        if (activeButton) {
            return activeButton.dataset.poi;
        }
        // Default to 'both' since we want to upload to both POIs by default
        return 'both';
    }
    
    // Public API
    return {
        init: init,
        renderText: renderText,
        getCanvasAsFile: getCanvasAsFile,
        getCanvasDimensions: getCanvasDimensions,
        getCurrentText: getCurrentText,
        getSelectedColor: getSelectedColor,
        getSelectedFilename: getSelectedFilename,
        getSelectedPoi: getSelectedPoi,
        showStatus: showStatus,
        enableUploadButton: enableUploadButton,
        disableUploadButton: disableUploadButton
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Check if we're on the text tab
        if (document.getElementById('text')) {
            TextTab.init();
        }
    });
} else {
    // DOM already loaded
    if (document.getElementById('text')) {
        TextTab.init();
    }
}

// Export for testing and integration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextTab;
} else {
    window.TextTab = TextTab;
}
