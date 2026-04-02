// Pattern sending function for image activation
async function sendPatternToBothPOIs(pattern) {
    try {
        // Send pattern to both POIs with timeout for backwards compatibility
        const requests = [
            fetch(`http://${state.poiIPs.mainIP}/pattern?patternChooserChange=${pattern}`, { 
                method: 'GET',
                signal: AbortSignal.timeout(2000) 
            }).catch(error => {
                console.log('Pattern request to main POI failed (backwards compatibility):', error.message);
                // Don't show error message for timeout - device might not support this feature
            }),
            fetch(`http://${state.poiIPs.auxIP}/pattern?patternChooserChange=${pattern}`, { 
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            }).catch(error => {
                console.log('Pattern request to aux POI failed (backwards compatibility):', error.message);
                // Don't show error message for timeout - device might not support this feature
            })
        ];

        await Promise.allSettled(requests);
        createMessage(`Pattern ${pattern} activated`);
    } catch (error) {
        // This should only catch unexpected errors, not timeouts
        console.error('Unexpected error sending pattern:', error);
        // Don't show error message to maintain backwards compatibility
    }
}
// Long Press Functions
let longPressTimer = null;
let longPressTarget = null;

// File Validation Constants
const MAX_FILE_SIZE_MB = 10; // Maximum file size in MB
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes

// Supported image file types
const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/webp'
];

// File validation function
function validateDroppedFile(file) {
    // Check file type
    const isValidType = SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase()) || 
                       /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name);
    
    if (!isValidType) {
        return {
            valid: false,
            error: `Invalid file type: "${file.name}". Please drop image files only (JPEG, PNG, GIF, BMP, WebP).`
        };
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        return {
            valid: false,
            error: `File too large: "${file.name}" is ${fileSizeMB} MB. Maximum size is ${MAX_FILE_SIZE_MB} MB.`
        };
    }
    
    // Check for empty files
    if (file.size === 0) {
        return {
            valid: false,
            error: `Empty file: "${file.name}" has no content.`
        };
    }
    
    // All checks passed
    return {
        valid: true,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
    };
}

// Drag-and-Drop Visual Feedback Helper Functions
function handleDragEnter(event) {
    event.preventDefault();
    const wrapper = event.target.closest('.image-wrapper');
    if (wrapper) {
        wrapper.classList.add('drag-over');
        
        // Determine if this is a valid drop target
        const targetFileName = wrapper.dataset.fileName;
        const isValidTarget = targetFileName && /^[a-zA-Z0-9-_.]{1,50}\.bin$/i.test(targetFileName);
        
        if (isValidTarget) {
            wrapper.classList.add('drag-valid');
            wrapper.classList.remove('drag-invalid');
        } else {
            wrapper.classList.add('drag-invalid');
            wrapper.classList.remove('drag-valid');
        }
    }
}

function handleDragLeave(event) {
    event.preventDefault();
    const wrapper = event.target.closest('.image-wrapper');
    if (wrapper) {
        wrapper.classList.remove('drag-over', 'drag-valid', 'drag-invalid');
    }
}

function handleTileDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    
    // Update visual feedback
    const wrapper = event.target.closest('.image-wrapper');
    if (wrapper && !wrapper.classList.contains('drag-over')) {
        wrapper.classList.add('drag-over');
    }
}

// Enhanced handleImageDrop function with validation
function handleEnhancedImageDrop(event, ip) {
    event.preventDefault();
    
    const files = event.dataTransfer.files;
    if (files.length === 0) {
        createMessage('No files were dropped', 'warning');
        return;
    }

    // Get the closest image-wrapper ancestor of the drop target
    const dropTarget = event.target.closest('.image-wrapper');
    
    // Validate drop target
    if (!dropTarget) {
        createMessage('Please drop files onto an image tile', 'error');
        return;
    }

    const targetFileName = dropTarget.dataset.fileName;
    
    // Validate target filename exists and matches expected format
    if (!targetFileName || !/^[a-zA-Z0-9-_.]{1,50}\.bin$/i.test(targetFileName)) {
        createMessage('Invalid drop target - not a valid image tile', 'error');
        return;
    }

    // Process each dropped file with validation
    const validFiles = [];
    const invalidFiles = [];
    
    Array.from(files).forEach(file => {
        const validation = validateDroppedFile(file);
        
        if (validation.valid) {
            validFiles.push({
                file: file,
                validation: validation
            });
        } else {
            invalidFiles.push({
                file: file,
                error: validation.error
            });
        }
    });

    // Show warnings for invalid files
    invalidFiles.forEach(invalid => {
        createMessage(invalid.error, 'warning');
    });

    if (validFiles.length === 0) {
        createMessage('No valid image files to upload', 'warning');
        return;
    }

    // Process each valid file
    validFiles.forEach((fileData, index) => {
        // For multiple files, we need to handle them differently
        // For now, we'll process them sequentially with a small delay
        setTimeout(() => {
            // Check if handleImageUpload function is available
            if (typeof window.handleImageUpload === 'function') {
                window.handleImageUpload(fileData.file, ip, targetFileName);
            } else {
                // Fallback: try to find the function in image-processing.js
                if (typeof handleImageUpload === 'function') {
                    handleImageUpload(fileData.file, ip, targetFileName);
                } else {
                    console.error('handleImageUpload function not available');
                    createMessage('Upload functionality not available', 'error');
                }
            }
        }, index * 100); // Small delay between files to avoid overwhelming the POI
    });

    // Show success message
    if (validFiles.length === 1) {
        createMessage(`Uploading ${validFiles[0].file.name} to ${targetFileName}...`, 'info');
    } else {
        createMessage(`Uploading ${validFiles.length} files to ${targetFileName}...`, 'info');
    }
}
function handleTouchStart(e) {
    const wrapper = e.target.closest('.image-wrapper');
    if (!wrapper) return;
    
    longPressTarget = wrapper;
    longPressTimer = setTimeout(() => {
        showContextMenu(wrapper);
    }, 500); // 500ms for long press
}

function handleTouchMove(e) {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function handleTouchEnd(e) {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function showContextMenu(wrapper) {
    // Remove any existing context menu
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="menu-item" data-action="upload">Upload</div>
        <div class="menu-item" data-action="delete">Delete</div>
    `;
    
    // Position menu near the wrapper
    const rect = wrapper.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = rect.left + 'px';
    menu.style.top = rect.bottom + 'px';
    menu.style.zIndex = '1000';
    
    // Add menu styles
    menu.style.backgroundColor = 'white';
    menu.style.border = '1px solid #ccc';
    menu.style.borderRadius = '4px';
    menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    menu.style.padding = '8px 0';
    
    // Style menu items
    const menuItems = menu.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.style.padding = '8px 16px';
        item.style.cursor = 'pointer';
        item.style.borderBottom = '1px solid #eee';
        item.style.fontSize = '14px';
        
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            handleMenuAction(item.dataset.action, wrapper);
            menu.remove();
        });
        
        // Hover effect
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#f0f0f0';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
    });
    
    // Remove last border
    menuItems[menuItems.length - 1].style.borderBottom = 'none';
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
}

function handleMenuAction(action, wrapper) {
    const fileName = wrapper.dataset.fileName;
    const ip = getIPFromContainer(wrapper.closest('.image-grid-container'));
    
    switch (action) {
        case 'upload':
            triggerFileUpload(wrapper, ip, fileName);
            break;
        case 'delete':
            deleteImageFromPoi(ip, fileName);
            break;
    }
}

function getIPFromContainer(container) {
    if (container.id === 'mainImageGrid') {
        return state.poiIPs.mainIP;
    } else if (container.id === 'auxImageGrid') {
        return state.poiIPs.auxIP;
    }
    return null;
}

function triggerFileUpload(wrapper, ip, fileName) {
    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file, ip, fileName);
        }
        fileInput.remove();
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

async function deleteImageFromPoi(ip, fileName) {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`http://${ip}/edit?path=/${fileName}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            createMessage(`${fileName} deleted successfully`);
            // Refresh the image to show black placeholder
            const containerId = ip === state.poiIPs.mainIP ? 'mainImageGrid' : 'auxImageGrid';
            const container = document.getElementById(containerId);
            if (container) {
                const wrapper = container.querySelector(`[data-file-name="${fileName}"]`);
                if (wrapper) {
                    const img = wrapper.querySelector('.poi-image');
                    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                }
            }
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        console.error('Delete error:', error);
        createMessage(`Failed to delete ${fileName}`, 'error');
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable-file:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateFilesOrder() {
    const fileList = document.getElementById('fileListContainer');
    const files = Array.from(fileList.children).map(el => el.dataset.fileName);
    console.log('Current file order:', files);
}

// Images Tab Functions

// Image Management Functions
function refreshAllImages(fullRefresh = false) {
    if (fullRefresh) {
        createBlackImages('mainImageGrid', state.poiIPs.mainIP);
        createBlackImages('auxImageGrid', state.poiIPs.auxIP);
    } else {
        // Just update image sizes
        document.querySelectorAll('.poi-image').forEach(img => {
            img.style.width = `${state.settings.pixels}px`;
            img.style.height = `${state.settings.pixels}px`;
        });
    }
}
function createBlackImages(containerId, ip) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    for (let i = 0; i < 62; i++) {
        const char = getCharFromIndex(i);
        const fileName = char + '.bin';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper draggable-file';
        wrapper.draggable = true;
        wrapper.dataset.fileName = fileName;
        
        const imgElement = document.createElement('img');
        imgElement.className = 'poi-image';
        imgElement.alt = fileName;
        imgElement.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        imgElement.title = fileName;

        const fileNameSpan = document.createElement('span');
        fileNameSpan.className = 'bin-filename';
        fileNameSpan.textContent = fileName;

        wrapper.appendChild(imgElement);
        wrapper.appendChild(fileNameSpan);
        
        // Touch handlers for long press
        wrapper.addEventListener('touchstart', handleTouchStart);
        wrapper.addEventListener('touchmove', handleTouchMove);
        wrapper.addEventListener('touchend', handleTouchEnd);
        
        // Mouse handlers for desktop testing
        wrapper.addEventListener('mousedown', handleTouchStart);
        wrapper.addEventListener('mousemove', handleTouchMove);
        wrapper.addEventListener('mouseup', handleTouchEnd);
        wrapper.addEventListener('mouseleave', handleTouchEnd);
        // Conditionally add drag-and-drop handlers for desktop devices
        if (typeof window.isDesktopDevice === 'function' && window.isDesktopDevice()) {
            // Drag event handlers for visual feedback
            wrapper.addEventListener('dragenter', handleDragEnter);
            wrapper.addEventListener('dragover', handleTileDragOver);
            wrapper.addEventListener('dragleave', handleDragLeave);
            wrapper.addEventListener('drop', function(e) {
                e.preventDefault();
                // Remove all drag feedback classes
                this.classList.remove('drag-over', 'drag-valid', 'drag-invalid');
                // Call the enhanced handleImageDrop function
                handleEnhancedImageDrop(e, ip);
            });
        }

        // Click handler for preview and pattern activation
        wrapper.addEventListener('click', function() {
            // Send pattern HTTP request for this image (pattern 8-69)
            const patternNumber = i + 8; // Map images to patterns 8-69
            sendPatternToBothPOIs(patternNumber);
            
            // Also show the image preview (existing functionality)
            if (typeof window.decompressAndDisplay === 'function') {
                window.decompressAndDisplay(ip, fileName);
            } else {
                console.error('decompressAndDisplay function not available');
                createMessage('Image processing function not available', 'error');
            }
        });

        container.appendChild(wrapper);
    }
}

function handleDragOver(e) {
  e.preventDefault();
  const dragging = document.querySelector('.dragging');
  if (!dragging) return;

  // Get the closest valid drop container
  const container = e.currentTarget.closest('.image-grid-container, #fileListContainer');
  if (!container || !container.appendChild) return;

  const afterElement = getDragAfterElement(container, e.clientY);
  
  if (container && dragging && container instanceof Node && dragging instanceof Node) {
    if (afterElement && afterElement.parentNode === container) {
      container.insertBefore(dragging, afterElement);
    } else if (dragging.parentNode !== container) {
      container.appendChild(dragging);
    }
  }
}

function handleImageDrop(event, ip) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        // Get the closest image-wrapper ancestor of the drop target
        const dropTarget = event.target.closest('.image-wrapper');
        let targetFileName = dropTarget?.dataset?.fileName;

        // Only use tile filename if dropping on a valid tile
        if (dropTarget && targetFileName) {
            handleImageUpload(files[0], ip, targetFileName);
        }
        // Optional: Add else case here if you want different behavior for grid drops
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
}


// Image handling core functions
async function updatePixelsOnBoth() {
  const pixels = document.getElementById('pixelInput').value;
  if (!pixels || pixels < 1 || pixels > 1000) {
    createMessage('Invalid pixel value (1-1000)', 'error');
    return;
  }
  
  try {
    const [mainRes, auxRes] = await Promise.all([
      fetch(`http://${state.poiIPs.mainIP}/pixels?num=${pixels}`),
      fetch(`http://${state.poiIPs.auxIP}/pixels?num=${pixels}`)
    ]);
    
    if (!mainRes.ok || !auxRes.ok) throw new Error('Pixel update failed');
    
    updateAllPixelDisplays(parseInt(pixels, 10));
    
    createMessage(`Pixels updated to ${state.settings.pixels}`);
    refreshAllImages(true); // Force full refresh
  } catch (error) {
    console.error('Pixel update failed:', error);
    createMessage('Failed to update pixels', 'error');
  }
}

async function getFilesAndDisplay() {
  console.log('getFilesAndDisplay called');
  await getFilesOne();
  await getFilesTwo();
}

async function getFilesOne() {
  const indicator = document.getElementById('get-files-one-indicator');
  try {
    indicator.textContent = "Fetching images...";
    const response = await fetch(`http://${state.poiIPs.mainIP}/list?dir=/`);
    const files = await response.json();
    const imageFiles = files.filter(f => f.name.endsWith('.bin')).map(f => f.name);
    
    for (const fileName of imageFiles) {
      // Use the decompressAndDisplay function directly from image-processing.js
      if (typeof window.decompressAndDisplay === 'function') {
        await window.decompressAndDisplay(state.poiIPs.mainIP, fileName);
      } else {
        console.error('decompressAndDisplay function not available');
        createMessage('Image processing function not available', 'error');
        break;
      }
    }
    indicator.textContent = "Images fetched successfully";
  } catch (error) {
    console.error('Error fetching main images:', error);
    indicator.textContent = "Failed to fetch images";
  }
}

async function getFilesTwo() {
  const indicator = document.getElementById('get-files-two-indicator');
  try {
    indicator.textContent = "Fetching images...";
    const response = await fetch(`http://${state.poiIPs.auxIP}/list?dir=/`);
    const files = await response.json();
    const imageFiles = files.filter(f => f.name.endsWith('.bin')).map(f => f.name);
    
    for (const fileName of imageFiles) {
      // Use the decompressAndDisplay function directly from image-processing.js
      if (typeof window.decompressAndDisplay === 'function') {
        await window.decompressAndDisplay(state.poiIPs.auxIP, fileName);
      } else {
        console.error('decompressAndDisplay function not available');
        createMessage('Image processing function not available', 'error');
        break;
      }
    }
    indicator.textContent = "Images fetched successfully";
  } catch (error) {
    console.error('Error fetching aux images:', error);
    indicator.textContent = "Failed to fetch images";
  }
}

// Add to init function
async function fetchInitialPixels() {
  try {
    const mainPixels = await fetchNumberOfPixels(state.poiIPs.mainIP);
    const auxPixels = await fetchNumberOfPixels(state.poiIPs.auxIP);
    
    // If both POIs respond, use main POI as primary, but update displays for both
    if (mainPixels !== null) {
      updatePixelDisplayForPoi('main', mainPixels);
    }
    if (auxPixels !== null) {
      updatePixelDisplayForPoi('aux', auxPixels);
    }
    
    // Warn if values differ between POIs
    if (mainPixels !== null && auxPixels !== null && mainPixels !== auxPixels) {
      createMessage('Warning: Main and Aux POIs have different pixel counts!', 'warning');
    }
  } catch (error) {
    console.error('Error fetching initial pixels:', error);
  }
}

// Modal Dialog Functions
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

function setupImageHandlers() {
  // Remove existing drag handlers first
  document.querySelectorAll('.image-grid-container').forEach(grid => {
    grid.removeEventListener('dragover', handleDragOver);
    grid.removeEventListener('drop', handleImageDrop);
  });

  // Initialize image grids with current IPs only if empty
  const mainGrid = document.getElementById('mainImageGrid');
  const auxGrid = document.getElementById('auxImageGrid');
  
  if (mainGrid && mainGrid.children.length === 0) {
    createBlackImages('mainImageGrid', state.poiIPs.mainIP);
  }
  if (auxGrid && auxGrid.children.length === 0) {
    createBlackImages('auxImageGrid', state.poiIPs.auxIP);
  }

  // Add new drag handlers to containers
  document.querySelectorAll('.image-grid-container').forEach(grid => {
    grid.addEventListener('dragover', handleDragOver);
    grid.addEventListener('drop', (event) => {
      // Use our primary handler that checks for valid tiles
      handleImageDrop(event, grid.id === 'mainImageGrid' 
        ? state.poiIPs.mainIP 
        : state.poiIPs.auxIP
      );
    });
  });
  
  document.getElementById('updatePixels').addEventListener('click', updatePixelsOnBoth);
}
// Attach functions to window object for global access
window.getFilesAndDisplay = getFilesAndDisplay;
window.getFilesOne = getFilesOne;
window.getFilesTwo = getFilesTwo;

// Also attach to window.images namespace for modular access
if (!window.images) window.images = {};
window.images.getFilesAndDisplay = getFilesAndDisplay;
window.images.getFilesOne = getFilesOne;
window.images.getFilesTwo = getFilesTwo;