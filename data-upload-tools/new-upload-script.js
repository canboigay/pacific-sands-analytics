let uploadedData = null;
let parsedData = [];

// Drag and drop functionality
const fileInput = document.getElementById('fileInput');
const uploadZone = document.querySelector('.upload-zone');

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

// Handle file upload
function handleFile(file) {
    if (!file.name.endsWith('.csv')) {
        alert('Please upload a CSV file');
        return;
    }

    // Show file info
    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('fileName').textContent = file.name + ' (' + formatFileSize(file.size) + ')';

    // Parse CSV
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            uploadedData = results;
            parsedData = results.data;
            analyzeData();
            showDataSummary();
        },
        error: function(error) {
            alert('Error parsing CSV: ' + error.message);
        }
    });
}

// Analyze uploaded data
function analyzeData() {
    if (!parsedData.length) return;

    const columns = Object.keys(parsedData[0]);
    
    // Update summary cards
    document.getElementById('rowCount').textContent = parsedData.length.toLocaleString();
    document.getElementById('columnCount').textContent = columns.length;
    
    // Detect date range
    const dateColumns = columns.filter(col => {
        const sample = parsedData.slice(0, 10).map(row => row[col]);
        return sample.some(val => val && !isNaN(Date.parse(val)));
    });
    
    if (dateColumns.length > 0) {
        const dates = parsedData.map(row => new Date(row[dateColumns[0]]))
                                .filter(d => !isNaN(d))
                                .sort((a, b) => a - b);
        
        if (dates.length > 0) {
            const startDate = dates[0].toLocaleDateString();
            const endDate = dates[dates.length - 1].toLocaleDateString();
            document.getElementById('dateRange').textContent = `${startDate} - ${endDate}`;
        }
    }
    
    // Detect room types
    const roomTypeColumns = columns.filter(col => 
        col.toLowerCase().includes('room') || 
        col.toLowerCase().includes('type') ||
        col.toLowerCase().includes('category')
    );
    
    let roomTypeCount = 0;
    if (roomTypeColumns.length > 0) {
        const roomTypes = new Set();
        parsedData.forEach(row => {
            roomTypeColumns.forEach(col => {
                if (row[col]) roomTypes.add(row[col]);
            });
        });
        roomTypeCount = roomTypes.size;
    }
    
    document.getElementById('roomTypes').textContent = roomTypeCount || 'N/A';
    
    // Show column types
    const columnsGrid = document.getElementById('columnsGrid');
    columnsGrid.innerHTML = '';
    
    columns.forEach(col => {
        const dataType = detectColumnType(col);
        const tag = document.createElement('div');
        tag.className = `column-tag ${dataType}`;
        tag.textContent = col;
        columnsGrid.appendChild(tag);
    });
    
    // Generate preview table
    generatePreviewTable();
    
    // Generate insights
    generateInsights();
}

// Detect column data type
function detectColumnType(columnName) {
    const sample = parsedData.slice(0, 10).map(row => row[columnName]).filter(val => val != null);
    
    // Check for dates
    if (sample.some(val => !isNaN(Date.parse(val)))) {
        return 'date';
    }
    
    // Check for numbers
    if (sample.every(val => !isNaN(parseFloat(val)))) {
        return 'number';
    }
    
    return 'text';
}

// Generate preview table
function generatePreviewTable() {
    const table = document.getElementById('previewTable');
    const columns = Object.keys(parsedData[0] || {});
    
    // Create header
    const thead = table.querySelector('thead');
    thead.innerHTML = '<tr>' + columns.map(col => `<th>${col}</th>`).join('') + '</tr>';
    
    // Create body with first 10 rows
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = parsedData.slice(0, 10).map(row => 
        '<tr>' + columns.map(col => `<td>${row[col] || ''}</td>`).join('') + '</tr>'
    ).join('');
}

// Generate insights
function generateInsights() {
    const insights = [];
    const columns = Object.keys(parsedData[0] || {});
    
    // Pricing insights
    const priceColumns = columns.filter(col => 
        col.toLowerCase().includes('rate') || 
        col.toLowerCase().includes('price') ||
        col.toLowerCase().includes('cost')
    );
    
    if (priceColumns.length > 0) {
        priceColumns.forEach(col => {
            const values = parsedData.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
            if (values.length > 0) {
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const min = Math.min(...values);
                const max = Math.max(...values);
                
                insights.push({
                    title: `${col} Analysis`,
                    content: `Average: $${avg.toFixed(2)}, Range: $${min} - $${max}`,
                    type: 'pricing'
                });
            }
        });
    }
    
    // Date patterns
    const dateColumns = columns.filter(col => detectColumnType(col) === 'date');
    if (dateColumns.length > 0) {
        insights.push({
            title: 'Date Coverage',
            content: `Found ${dateColumns.length} date column(s) spanning ${parsedData.length} records`,
            type: 'temporal'
        });
    }
    
    // Room type diversity
    const roomTypeColumns = columns.filter(col => 
        col.toLowerCase().includes('room') || 
        col.toLowerCase().includes('type')
    );
    
    if (roomTypeColumns.length > 0) {
        const roomTypes = new Set();
        parsedData.forEach(row => {
            roomTypeColumns.forEach(col => {
                if (row[col]) roomTypes.add(row[col]);
            });
        });
        
        insights.push({
            title: 'Room Type Diversity',
            content: `Found ${roomTypes.size} unique room types/categories`,
            type: 'inventory'
        });
    }
    
    // Display insights
    const insightsList = document.getElementById('insightsList');
    insightsList.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <strong>${insight.title}</strong><br>
            ${insight.content}
        </div>
    `).join('');
}

// Show data summary section
function showDataSummary() {
    document.getElementById('dataSummary').style.display = 'block';
}

// Process and upload data
async function processData() {
    document.getElementById('dataSummary').style.display = 'none';
    document.getElementById('progressSection').style.display = 'block';
    
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    // Simulate processing steps
    const steps = [
        { text: 'Analyzing data structure...', progress: 20 },
        { text: 'Creating room type database...', progress: 40 },
        { text: 'Building price history timeline...', progress: 60 },
        { text: 'Generating reference data...', progress: 80 },
        { text: 'Uploading to MCP system...', progress: 100 }
    ];
    
    for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        progressFill.style.width = steps[i].progress + '%';
        progressText.textContent = steps[i].text;
    }
    
    // Show success
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('successMessage').style.display = 'block';
    
    // Here you would actually call your MCP tools to upload the data
    // For example:
    // await uploadToMCP(parsedData);
}

// Reset data
function resetData() {
    uploadedData = null;
    parsedData = [];
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('dataSummary').style.display = 'none';
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    fileInput.value = '';
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    else return Math.round(bytes / 1048576) + ' MB';
}

// Mock MCP upload function
async function uploadToMCP(data) {
    // This would integrate with your actual MCP system
    console.log('Uploading', data.length, 'records to MCP system...');
    
    // Create room type reference
    const roomTypes = new Set();
    const columns = Object.keys(data[0] || {});
    const roomTypeColumns = columns.filter(col => 
        col.toLowerCase().includes('room') || 
        col.toLowerCase().includes('type')
    );
    
    data.forEach(row => {
        roomTypeColumns.forEach(col => {
            if (row[col]) roomTypes.add(row[col]);
        });
    });
    
    // Create price history
    const priceHistory = data.map(row => ({
        date: row.date || row.Date || Object.values(row)[0],
        room_type: roomTypeColumns.length > 0 ? row[roomTypeColumns[0]] : 'Standard',
        rate: parseFloat(Object.values(row).find(val => !isNaN(parseFloat(val)))) || 0,
        source: 'historical_upload'
    }));
    
    console.log('Room types found:', Array.from(roomTypes));
    console.log('Price history entries:', priceHistory.length);
}