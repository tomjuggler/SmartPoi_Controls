// File Lists Tab Functions

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