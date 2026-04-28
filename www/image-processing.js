// Shared Image Processing Function
async function processImageFile(file, pixelCount) {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
            try {
                const image = await Jimp.read(event.target.result);
                const rotatedImage = image.rotate(-90);
                const rotatedWidth = rotatedImage.bitmap.width;
                const rotatedHeight = rotatedImage.bitmap.height;
                
                let compressionFactor = 1;
                if (state.stripType === "WS2812") {
                    compressionFactor = 0.5;
                } else if (state.stripType === "CUSTOM") {
                    compressionFactor = state.customCompression / 100;
                }
                
                const aspectRatio = rotatedWidth / (rotatedHeight * compressionFactor);
                const targetPixels = pixelCount || state.settings.pixels;
                const targetHeight = Math.floor(targetPixels / aspectRatio);
                
                const processed = rotatedImage.resize(
                    targetPixels,  // width
                    targetHeight            // height
                );
                const binaryData = [];
                processed.scan(0, 0, processed.bitmap.width, processed.bitmap.height, 
                    (x, y, idx) => {
                        const r = processed.bitmap.data[idx];
                        const g = processed.bitmap.data[idx + 1];
                        const b = processed.bitmap.data[idx + 2];
                        const encoded = ((r & 0xE0) | ((g & 0xE0) >> 3) | (b >> 6));
                        binaryData.push(encoded);
                    }
                );

                resolve(new Uint8Array(binaryData));
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsDataURL(file);
    });
}

// Image Upload Handler
async function handleImageUpload(file, ip, targetFileName) {
    // Validate target filename first
    if (!/^[a-zA-Z0-9-_.]{1,50}\.bin$/i.test(targetFileName)) {
        createMessage('Invalid target tile filename', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9-_.]{1,50}\.bin$/i.test(targetFileName)) {
        createMessage('Invalid target tile filename', 'error');
        return;
    }

    // Store original pattern and turn off LEDs for upload
    let originalPattern;
    try {
        originalPattern = await fetch(`http://${ip}/returnsettings`)
            .then(res => res.text())
            .then(data => data.split(',').pop().trim());
        
        await fetch(`http://${ip}/pattern?patternChooserChange=7`);
    } catch (error) {
        console.error('Error preparing for upload:', error);
        createMessage('Failed to initialize upload', 'error');
        return;
    }

    try {
        const binaryData = await processImageFile(file);
        
        const formData = new FormData();
        formData.append('file', new Blob([binaryData], {
            type: 'application/octet-stream'
        }), targetFileName);

        const uploadResponse = await fetch(`http://${ip}/edit`, {
            method: 'POST',
            body: formData
        });
        
        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }
        
        createMessage(`Image ${targetFileName} uploaded successfully`);
        if (typeof window.decompressAndDisplay === 'function') {
            window.decompressAndDisplay(ip, targetFileName);
        } else {
            console.error('decompressAndDisplay function not available');
        }
    } catch (error) {
        console.error('Upload failed:', error);
        createMessage(`Upload failed: ${error.message}`, 'error');
    } finally {
        // Restore original pattern
        try {
            await fetch(`http://${ip}/pattern?patternChooserChange=${originalPattern}`);
        } catch (error) {
            console.error('Failed to restore pattern:', error);
        }
    }
}

window.decompressAndDisplay = async function(ip, fileName) {
    try {
        // Update validation to match filename rules exactly
        if (!/^[a-zA-Z0-9-_.]{1,50}\.bin$/i.test(fileName)) {
            console.error(`Invalid filename format: ${fileName}`);
            createMessage('Invalid image filename format', 'error');
            return;
        }
        
        const response = await fetch(`http://${ip}/edit?file=${encodeURIComponent(fileName)}`);
        const arrayBuffer = await response.arrayBuffer();
        const binaryData = new Uint8Array(arrayBuffer);
        const imageUrl = await decompress(binaryData);
        const rotatedImageUrl = await rotateImage90(imageUrl);

        // Create new image element
        const imgElement = document.createElement('img');
        imgElement.className = 'poi-image';
        imgElement.src = rotatedImageUrl;
        imgElement.alt = fileName;
        imgElement.style.width = '100%';
        imgElement.style.height = '100%';

        // Find and replace existing image
        const containerId = ip === state.poiIPs.mainIP ? 'mainImageGrid' : 'auxImageGrid';
        const container = document.getElementById(containerId);
        const existingImages = container.getElementsByClassName('poi-image');
        
        Array.from(existingImages).forEach(img => {
            if (img.alt === fileName) {
                img.parentNode.replaceChild(imgElement, img);
            }
        });

    } catch (error) {
        console.error(`Error decompressing and displaying ${fileName}:`, error);
        if (retryCount < MAX_RETRY_COUNT) {
            retryCount++;
            window.decompressAndDisplay(ip, fileName);
        } else {
            console.error(`Max retries exceeded for ${fileName}`);
            retryCount = 0;
        }
    }
}

async function decompress(binaryData) {
    const width = state.settings.pixels;
    const height = Math.ceil(binaryData.length / width);
    const image = new Jimp(width, height);

    let dataIndex = 0;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (dataIndex < binaryData.length) {
                const encodedValue = binaryData[dataIndex];
                const r = ((encodedValue & 0xE0) >> 5) << 3;
                const g = ((encodedValue & 0x1C) >> 2) << 3;
                const b = (encodedValue & 0x03) << 6;
                image.setPixelColor(Jimp.rgbaToInt(r, g, b, 255), x, y);
                dataIndex++;
            }
        }
    }
    return image.getBase64Async(Jimp.MIME_PNG);
}

async function rotateImage90(imageUrl) {
    return new Promise((resolve, reject) => {
        Jimp.read(imageUrl, (err, image) => {
            if (err) reject(err);
            image.rotate(90).getBase64Async(Jimp.MIME_PNG)
                .then(resolve)
                .catch(reject);
        });
    });
}

async function fetchDataWithRetry(url) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url);
            if (response.ok) return response;
            console.log(`Retrying... Attempt ${attempt}/${maxRetries}`);
        } catch (error) {
            console.error('Fetch error:', error);
            if (attempt === maxRetries) throw error;
        }
    }
}