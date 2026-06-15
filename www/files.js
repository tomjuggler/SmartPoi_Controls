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

async function getFileListThree() {
    try {
        const response = await fetch(`http://${state.poiIPs.poiThreeIP}/list?dir=/`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.text();
        document.getElementById('fileListTextAreaThree').value = data;
        createMessage('POI 3 files fetched successfully');
    } catch (error) {
        console.error('Error fetching POI 3 files:', error);
        createMessage('Failed to fetch POI 3 files', 'error');
    }
}

async function getFileListFour() {
    try {
        const response = await fetch(`http://${state.poiIPs.poiFourIP}/list?dir=/`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.text();
        document.getElementById('fileListTextAreaFour').value = data;
        createMessage('POI 4 files fetched successfully');
    } catch (error) {
        console.error('Error fetching POI 4 files:', error);
        createMessage('Failed to fetch POI 4 files', 'error');
    }
}

async function getFileListFive() {
    try {
        const response = await fetch(`http://${state.poiIPs.poiFiveIP}/list?dir=/`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.text();
        document.getElementById('fileListTextAreaFive').value = data;
        createMessage('POI 5 files fetched successfully');
    } catch (error) {
        console.error('Error fetching POI 5 files:', error);
        createMessage('Failed to fetch POI 5 files', 'error');
    }
}

async function getFileListSix() {
    try {
        const response = await fetch(`http://${state.poiIPs.poiSixIP}/list?dir=/`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.text();
        document.getElementById('fileListTextAreaSix').value = data;
        createMessage('POI 6 files fetched successfully');
    } catch (error) {
        console.error('Error fetching POI 6 files:', error);
        createMessage('Failed to fetch POI 6 files', 'error');
    }
}

async function getFileListSeven() {
    try {
        const response = await fetch(`http://${state.poiIPs.poiSevenIP}/list?dir=/`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.text();
        document.getElementById('fileListTextAreaSeven').value = data;
        createMessage('POI 7 files fetched successfully');
    } catch (error) {
        console.error('Error fetching POI 7 files:', error);
        createMessage('Failed to fetch POI 7 files', 'error');
    }
}

async function getFileListEight() {
    try {
        const response = await fetch(`http://${state.poiIPs.poiEightIP}/list?dir=/`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.text();
        document.getElementById('fileListTextAreaEight').value = data;
        createMessage('POI 8 files fetched successfully');
    } catch (error) {
        console.error('Error fetching POI 8 files:', error);
        createMessage('Failed to fetch POI 8 files', 'error');
    }
}