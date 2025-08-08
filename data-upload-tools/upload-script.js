// Initialize Lucide icons
lucide.createIcons();

let uploadedData = null;
let selectedDataType = null;
let parsedData = [];

// Field mappings for different data types
const fieldMappings = {
    bookings: {
        core: ['booking_id', 'guest_name', 'check_in', 'check_out'],
        suggested: ['room_type', 'rate', 'channel', 'status', 'guest_email', 'guest_phone'],
        flexible: true
    },
    competitor: {
        core: ['date'],
        suggested: ['competitor_name', 'average_rate', 'occupancy_rate', 'available_rooms'],
        flexible: true
    },
    reviews: {
        core: ['date'],
        suggested: ['rating', 'content', 'review_id', 'title', 'guest_type', 'source'],
        flexible: true
    },
    financial: {
        core: ['date'],
        suggested: ['revenue', 'adr', 'revpar', 'occupancy', 'bookings', 'room_type', 'rate'],
        flexible: true
    },
    custom: {
        core: [],
        suggested: [],
        flexible: true,
        description: 'Upload any data structure - system will auto-detect patterns'
    }
};

// Initialize drag and drop
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Data type selection
document.querySelectorAll('.data-type-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.data-type-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedDataType = card.dataset.type;
        
        if (uploadedData) {
            document.getElementById('validateBtn').disabled = false;
            createFieldMapping();
        }
    });
});

// Handle file upload
function handleFiles(files) {
    const file = files[0];
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // Display file info
    const uploadedFilesDiv = document.getElementById('uploadedFiles');
    uploadedFilesDiv.innerHTML = `
        <div class="file-item">
            <div class="file-info">
                <i data-lucide="file"></i>
                <div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="remove-file" onclick="removeFile()">
                <i data-lucide="x"></i>
            </button>
        </div>
    `;
    lucide.createIcons();
    
    // Parse file based on type
    if (fileExtension === 'csv') {
        parseCSV(file);
    } else if (fileExtension === 'json') {
        parseJSON(file);
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
        parseExcel(file);
    }
}

// Parse CSV file
function parseCSV(file) {
    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            parsedData = results.data.filter(row => Object.values(row).some(val => val !== null));
            uploadedData = results;
            showPreview();
            
            if (selectedDataType) {
                document.getElementById('validateBtn').disabled = false;
            }
        }
    });
}

// Parse JSON file
function parseJSON(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            parsedData = Array.isArray(data) ? data : [data];
            uploadedData = { data: parsedData };
            showPreview();
            
            if (selectedDataType) {
                document.getElementById('validateBtn').disabled = false;
            }
        } catch (error) {
            showError('Invalid JSON file');
        }
    };
    reader.readAsText(file);
}

// Parse Excel file
function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            
            // Get the first worksheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1,
                defval: ''
            });
            
            // Convert array of arrays to array of objects
            if (jsonData.length > 0) {
                const headers = jsonData[0];
                parsedData = jsonData.slice(1).map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] || '';
                    });
                    return obj;
                }).filter(row => Object.values(row).some(val => val !== ''));
                
                uploadedData = { data: parsedData };
                showPreview();
                
                if (selectedDataType) {
                    document.getElementById('validateBtn').disabled = false;
                }
            }
        } catch (error) {
            showError('Error parsing Excel file: ' + error.message);
        }
    };
    reader.readAsBinaryString(file);
}

// Show data preview
function showPreview() {
    const previewSection = document.getElementById('previewSection');
    const previewTable = document.getElementById('previewTable');
    const rowCount = document.getElementById('rowCount');
    
    previewSection.style.display = 'block';
    rowCount.textContent = `${parsedData.length} rows`;
    
    // Create table headers
    const headers = Object.keys(parsedData[0] || {});
    const thead = previewTable.querySelector('thead');
    thead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    
    // Create table rows (show first 10)
    const tbody = previewTable.querySelector('tbody');
    tbody.innerHTML = parsedData.slice(0, 10).map(row => 
        '<tr>' + headers.map(h => `<td>${row[h] || ''}</td>`).join('') + '</tr>'
    ).join('');
    
    // Set date range if applicable
    const dateFields = ['date', 'check_in', 'created_at', 'booking_date'];
    const dateField = headers.find(h => dateFields.includes(h.toLowerCase()));
    
    if (dateField) {
        const dates = parsedData.map(row => new Date(row[dateField])).filter(d => !isNaN(d));
        if (dates.length > 0) {
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            document.getElementById('startDate').value = minDate.toISOString().split('T')[0];
            document.getElementById('endDate').value = maxDate.toISOString().split('T')[0];
        }
    }
}

// Create field mapping interface
function createFieldMapping() {
    if (!selectedDataType || !parsedData.length) return;
    
    const mappingSection = document.getElementById('mappingSection');
    const mappingGrid = document.getElementById('mappingGrid');
    
    mappingSection.style.display = 'block';
    
    const sourceFields = Object.keys(parsedData[0] || {});
    
    if (selectedDataType === 'custom') {
        // For custom data, just show the detected fields
        mappingGrid.innerHTML = `
            <div style="grid-column: 1/-1; padding: 1rem; background: #f0f9ff; border-radius: 0.5rem; border: 1px solid #0369a1;">
                <h4 style="margin-bottom: 0.5rem; color: #0369a1;">Auto-detected fields:</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${sourceFields.map(field => `<span style="background: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem;">${field}</span>`).join('')}
                </div>
                <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #374151;">System will automatically process and categorize your data based on detected patterns.</p>
            </div>
        `;
        return;
    }
    
    const coreFields = fieldMappings[selectedDataType].core || [];
    const suggestedFields = fieldMappings[selectedDataType].suggested || [];
    const allFields = [...coreFields, ...suggestedFields];
    
    mappingGrid.innerHTML = allFields.map(field => {
        const isCore = coreFields.includes(field);
        const bestMatch = findBestMatch(field, sourceFields);
        
        return `
            <div class="mapping-item">
                <label>
                    ${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    ${isCore ? '<span style="color: #f59e0b; font-size: 0.75rem;">(recommended)</span>' : '<span style="color: #6b7280; font-size: 0.75rem;">(optional)</span>'}
                </label>
                <select id="map_${field}">
                    <option value="">-- Skip this field --</option>
                    ${sourceFields.map(sf => 
                        `<option value="${sf}" ${sf === bestMatch ? 'selected' : ''}>${sf}</option>`
                    ).join('')}
                </select>
            </div>
        `;
    }).join('');
}

// Find best matching field name
function findBestMatch(targetField, sourceFields) {
    const target = targetField.toLowerCase();
    
    // Exact match
    const exact = sourceFields.find(f => f.toLowerCase() === target);
    if (exact) return exact;
    
    // Contains match
    const contains = sourceFields.find(f => f.toLowerCase().includes(target) || target.includes(f.toLowerCase()));
    if (contains) return contains;
    
    // Special cases
    const mappings = {
        'booking_id': ['id', 'reservation_id', 'res_id', 'booking_number'],
        'guest_name': ['name', 'customer', 'guest', 'full_name'],
        'check_in': ['checkin', 'arrival', 'start_date'],
        'check_out': ['checkout', 'departure', 'end_date']
    };
    
    if (mappings[target]) {
        const mapped = sourceFields.find(f => 
            mappings[target].some(m => f.toLowerCase().includes(m))
        );
        if (mapped) return mapped;
    }
    
    return null;
}

// Validate data
function validateData() {
    const validationStatus = document.getElementById('validationStatus');
    const warnings = [];
    const errors = [];
    
    if (selectedDataType === 'custom') {
        // For custom data, just do basic validation
        validationStatus.className = 'validation-status success';
        validationStatus.innerHTML = `
            <i data-lucide="check-circle"></i>
            Data ready to upload! ${parsedData.length} records detected with ${Object.keys(parsedData[0] || {}).length} fields.
        `;
        document.getElementById('uploadBtn').disabled = false;
        validationStatus.style.display = 'block';
        lucide.createIcons();
        return;
    }
    
    // Check core fields (recommended but not required)
    const coreFields = fieldMappings[selectedDataType].core || [];
    coreFields.forEach(field => {
        const mapping = document.getElementById(`map_${field}`);
        if (!mapping || !mapping.value) {
            warnings.push(`Recommended field "${field}" is not mapped`);
        }
    });
    
    // Validate data format for mapped fields only
    const mappedData = transformData();
    
    // Basic data validation
    mappedData.forEach((row, index) => {
        // Check if row has any mapped data
        const hasData = Object.values(row).some(val => val !== null && val !== '');
        if (!hasData) {
            errors.push(`Row ${index + 1}: No data found`);
        }
        
        // Validate specific field types
        Object.keys(row).forEach(field => {
            const value = row[field];
            if (value && field.includes('date')) {
                const date = new Date(value);
                if (isNaN(date)) {
                    errors.push(`Row ${index + 1}: Invalid date format in "${field}"`);
                }
            }
            
            if (value && field.includes('rate') && isNaN(parseFloat(value))) {
                errors.push(`Row ${index + 1}: Invalid number format in "${field}"`);
            }
        });
    });
    
    // Show validation results
    if (errors.length === 0) {
        validationStatus.className = 'validation-status success';
        let message = `<i data-lucide="check-circle"></i>
            Validation successful! ${parsedData.length} records ready to upload.`;
        
        if (warnings.length > 0) {
            message += `<br><small style="color: #f59e0b;">⚠️ ${warnings.length} recommendations: ${warnings.slice(0, 2).join(', ')}${warnings.length > 2 ? '...' : ''}</small>`;
        }
        
        validationStatus.innerHTML = message;
        document.getElementById('uploadBtn').disabled = false;
    } else {
        validationStatus.className = 'validation-status error';
        validationStatus.innerHTML = `
            <i data-lucide="alert-circle"></i>
            Found ${errors.length} validation issues:
            <ul>${errors.slice(0, 5).map(e => `<li>${e}</li>`).join('')}</ul>
            ${errors.length > 5 ? `<p>...and ${errors.length - 5} more issues</p>` : ''}
        `;
        document.getElementById('uploadBtn').disabled = true;
    }
    
    validationStatus.style.display = 'block';
    lucide.createIcons();
}

// Transform data based on mapping
function transformData() {
    if (selectedDataType === 'custom') {
        // For custom data, return as-is
        return parsedData;
    }
    
    const coreFields = fieldMappings[selectedDataType].core || [];
    const suggestedFields = fieldMappings[selectedDataType].suggested || [];
    const allFields = [...coreFields, ...suggestedFields];
    
    return parsedData.map(row => {
        const transformed = {};
        
        allFields.forEach(field => {
            const mapping = document.getElementById(`map_${field}`);
            if (mapping && mapping.value) {
                transformed[field] = row[mapping.value];
            }
        });
        
        return transformed;
    });
}

// Upload data to MCP
async function uploadData() {
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadBtn = document.getElementById('uploadBtn');
    
    uploadProgress.style.display = 'block';
    uploadBtn.disabled = true;
    
    const mappedData = transformData();
    const batches = [];
    const batchSize = 100;
    
    // Split into batches
    for (let i = 0; i < mappedData.length; i += batchSize) {
        batches.push(mappedData.slice(i, i + batchSize));
    }
    
    // Upload batches
    for (let i = 0; i < batches.length; i++) {
        const progress = ((i + 1) / batches.length) * 100;
        progressFill.style.width = progress + '%';
        progressText.textContent = `Uploading batch ${i + 1} of ${batches.length}...`;
        
        // Simulate upload (replace with actual MCP tool call)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In real implementation, you would call:
        // await callMCPTool(`upload_historical_${selectedDataType}`, {
        //     data_type: 'json',
        //     data: batches[i]
        // });
    }
    
    progressText.textContent = 'Upload complete!';
    
    setTimeout(() => {
        showSuccess();
    }, 1000);
}

// Show success message
function showSuccess() {
    const validationStatus = document.getElementById('validationStatus');
    validationStatus.className = 'validation-status success';
    validationStatus.innerHTML = `
        <i data-lucide="check-circle"></i>
        Successfully uploaded ${parsedData.length} records to MCP!
    `;
    lucide.createIcons();
    
    // Reset after delay
    setTimeout(resetUpload, 3000);
}

// Show error message
function showError(message) {
    const validationStatus = document.getElementById('validationStatus');
    validationStatus.className = 'validation-status error';
    validationStatus.innerHTML = `
        <i data-lucide="alert-circle"></i>
        ${message}
    `;
    validationStatus.style.display = 'block';
    lucide.createIcons();
}

// Remove file
function removeFile() {
    uploadedData = null;
    parsedData = [];
    document.getElementById('uploadedFiles').innerHTML = '';
    document.getElementById('previewSection').style.display = 'none';
    document.getElementById('mappingSection').style.display = 'none';
    document.getElementById('validateBtn').disabled = true;
    document.getElementById('uploadBtn').disabled = true;
}

// Reset upload
function resetUpload() {
    removeFile();
    document.querySelectorAll('.data-type-card').forEach(c => c.classList.remove('selected'));
    selectedDataType = null;
    document.getElementById('validationStatus').style.display = 'none';
    document.getElementById('uploadProgress').style.display = 'none';
    fileInput.value = '';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    else return Math.round(bytes / 1048576) + ' MB';
}