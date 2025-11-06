// Drag and Drop Functions
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.fileName);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDrop(e) {
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

    dragging.classList.remove('dragging');
    updateFilesOrder();
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
        
        // Drag handlers
        wrapper.addEventListener('dragstart', handleDragStart);
        wrapper.addEventListener('dragover', handleDragOver);
        wrapper.addEventListener('drop', handleDrop);
        wrapper.addEventListener('dragend', handleDragEnd);

        // Click handler for preview
        wrapper.addEventListener('click', function() {
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
    
    state.settings.pixels = parseInt(pixels, 10);
    document.getElementById('pixelInput').value = state.settings.pixels;
    document.getElementById('currentPx').textContent = `Current px: ${state.settings.pixels}`;
    saveState();
    
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
    
    // Always show current state, even if values differ between POIs
    state.settings.pixels = mainPixels || state.settings.pixels;
    document.getElementById('pixelInput').value = state.settings.pixels;
    document.getElementById('currentPx').textContent = `Current px: ${state.settings.pixels}`;
    
    if (mainPixels !== auxPixels) {
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

  // Initialize image grids with current IPs
  createBlackImages('mainImageGrid', state.poiIPs.mainIP);
  createBlackImages('auxImageGrid', state.poiIPs.auxIP);

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