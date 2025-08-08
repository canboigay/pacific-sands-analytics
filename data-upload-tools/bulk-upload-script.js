#!/usr/bin/env node

/**
 * Bulk CSV Upload Script for Pacific Sands Analytics
 * Handles large batches of CSV files with automatic data type detection
 */

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch'); // npm install node-fetch

class BulkUploader {
    constructor(apiUrl = 'http://localhost:3000', apiKey = 'ps_me2w0k3e_x81fsv0yz3k') {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.results = [];
    }

    detectDataType(filename) {
        const name = filename.toLowerCase();
        
        // Specific patterns for Pacific Sands data
        if (name.includes('rate') || name.includes('pricing') || name.includes('adr')) return 'rates';
        if (name.includes('booking') || name.includes('reservation') || name.includes('res_')) return 'bookings';
        if (name.includes('review') || name.includes('feedback') || name.includes('satisfaction')) return 'reviews';
        if (name.includes('competitor') || name.includes('comp_') || name.includes('market')) return 'competitors';
        if (name.includes('occupancy') || name.includes('occ_') || name.includes('revpar')) return 'occupancy';
        if (name.includes('revenue') || name.includes('rev_')) return 'revenue';
        if (name.includes('guest') || name.includes('customer')) return 'customer_data';
        if (name.includes('channel') || name.includes('source')) return 'channel_data';
        
        return 'rates'; // Default fallback
    }

    parseCSV(text) {
        try {
            const lines = text.trim().split('\n');
            if (lines.length < 2) {
                throw new Error('CSV file must have at least header and one data row');
            }

            const headers = this.parseCSVLine(lines[0]);
            const data = [];

            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = this.parseCSVLine(lines[i]);
                    const record = {};
                    
                    headers.forEach((header, index) => {
                        record[header] = values[index] || '';
                    });
                    
                    data.push(record);
                }
            }

            return data;
        } catch (error) {
            throw new Error(`CSV parsing error: ${error.message}`);
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    async uploadFile(filePath) {
        const filename = path.basename(filePath);
        console.log(`📁 Processing: ${filename}`);

        try {
            // Read and parse file
            const fileContent = await fs.readFile(filePath, 'utf8');
            const data = this.parseCSV(fileContent);
            
            if (data.length === 0) {
                throw new Error('No data rows found in CSV');
            }

            // Detect data type
            const dataType = this.detectDataType(filename);
            console.log(`   Type detected: ${dataType}`);
            console.log(`   Records found: ${data.length}`);

            // Prepare upload payload
            const uploadData = {
                data_type: dataType,
                data: data,
                source: 'bulk_upload_script',
                filename: filename,
                uploaded_at: new Date().toISOString()
            };

            // Upload to API
            const response = await fetch(`${this.apiUrl}/api/data/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(uploadData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log(`   ✅ Success: ${result.records_processed} records uploaded`);

            return {
                success: true,
                filename,
                dataType,
                records: result.records_processed,
                message: result.message
            };

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return {
                success: false,
                filename,
                error: error.message
            };
        }
    }

    async uploadDirectory(directoryPath, options = {}) {
        const { 
            batchSize = 5,
            delayBetweenBatches = 1000,
            filePattern = /\.csv$/i 
        } = options;

        console.log(`🚀 Starting bulk upload from: ${directoryPath}`);
        
        try {
            // Get all CSV files
            const files = await fs.readdir(directoryPath);
            const csvFiles = files.filter(file => filePattern.test(file));
            
            console.log(`📊 Found ${csvFiles.length} CSV files to upload`);
            
            if (csvFiles.length === 0) {
                console.log('No CSV files found in directory');
                return;
            }

            // Process files in batches
            for (let i = 0; i < csvFiles.length; i += batchSize) {
                const batch = csvFiles.slice(i, i + batchSize);
                console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(csvFiles.length / batchSize)}`);
                
                const batchPromises = batch.map(filename => {
                    const filePath = path.join(directoryPath, filename);
                    return this.uploadFile(filePath);
                });

                const batchResults = await Promise.all(batchPromises);
                this.results.push(...batchResults);

                // Progress update
                const completed = this.results.length;
                const progress = ((completed / csvFiles.length) * 100).toFixed(1);
                console.log(`📈 Progress: ${completed}/${csvFiles.length} files (${progress}%)`);

                // Delay between batches (except for last batch)
                if (i + batchSize < csvFiles.length) {
                    console.log(`⏳ Waiting ${delayBetweenBatches}ms before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                }
            }

            this.printSummary();

        } catch (error) {
            console.error('❌ Bulk upload failed:', error.message);
        }
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 BULK UPLOAD SUMMARY');
        console.log('='.repeat(50));

        const successful = this.results.filter(r => r.success);
        const failed = this.results.filter(r => !r.success);
        const totalRecords = successful.reduce((sum, r) => sum + (r.records || 0), 0);
        
        console.log(`Total files processed: ${this.results.length}`);
        console.log(`✅ Successful: ${successful.length}`);
        console.log(`❌ Failed: ${failed.length}`);
        console.log(`📈 Success rate: ${((successful.length / this.results.length) * 100).toFixed(1)}%`);
        console.log(`📊 Total records uploaded: ${totalRecords.toLocaleString()}`);

        // Group by data type
        const dataTypes = {};
        successful.forEach(result => {
            if (!dataTypes[result.dataType]) {
                dataTypes[result.dataType] = { files: 0, records: 0 };
            }
            dataTypes[result.dataType].files++;
            dataTypes[result.dataType].records += result.records || 0;
        });

        console.log('\n📋 Data Types Uploaded:');
        Object.entries(dataTypes).forEach(([type, stats]) => {
            console.log(`  ${type}: ${stats.files} files, ${stats.records.toLocaleString()} records`);
        });

        // Show failed files
        if (failed.length > 0) {
            console.log('\n❌ Failed Files:');
            failed.forEach(result => {
                console.log(`  ${result.filename}: ${result.error}`);
            });
        }

        console.log('\n🎉 Bulk upload complete!');
    }
}

// Command line usage
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node bulk-upload-script.js <directory-path> [api-url]');
        console.log('Example: node bulk-upload-script.js ./csv-files http://localhost:3000');
        process.exit(1);
    }

    const directoryPath = args[0];
    const apiUrl = args[1] || 'http://localhost:3000';
    
    const uploader = new BulkUploader(apiUrl);
    uploader.uploadDirectory(directoryPath, {
        batchSize: 3, // Conservative batch size for 140 files
        delayBetweenBatches: 2000 // 2 second delay between batches
    });
}

module.exports = BulkUploader;