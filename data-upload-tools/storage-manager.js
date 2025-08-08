const fs = require('fs').promises;
const path = require('path');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');

class StorageManager {
    constructor(baseDir = '/tmp/pacific-sands-data') {
        this.baseDir = baseDir;
        this.ensureDirectories();
    }

    async ensureDirectories() {
        const dirs = [
            'competitors/pricing',
            'competitors/reviews', 
            'social-media/mentions',
            'social-media/sentiment',
            'manual-uploads/rates',
            'manual-uploads/bookings',
            'manual-uploads/reviews',
            'knowledge-base/insights',
            'analytics/forecasts',
            'backups/daily',
            'backups/weekly'
        ];

        for (const dir of dirs) {
            await fs.mkdir(path.join(this.baseDir, dir), { recursive: true }).catch(() => {});
        }
    }

    getFilePath(dataType, subType = '') {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = new Date().toISOString().replace(/[:.]/g, '-');
        
        const typeMap = {
            'competitors': `competitors/${subType || 'pricing'}`,
            'mentions': 'social-media/mentions',
            'reviews': subType ? `competitors/reviews` : 'manual-uploads/reviews',
            'rates': 'manual-uploads/rates',
            'bookings': 'manual-uploads/bookings',
            'insights': 'knowledge-base/insights',
            'forecasts': 'analytics/forecasts'
        };

        const dir = typeMap[dataType] || 'misc';
        const filename = `${dataType}_${timestamp}_${timeStr}.json`;
        
        return path.join(this.baseDir, dir, filename);
    }

    async saveData(dataType, data, metadata = {}) {
        try {
            const filePath = this.getFilePath(dataType, metadata.subType);
            
            const record = {
                dataType,
                metadata: {
                    ...metadata,
                    timestamp: new Date().toISOString(),
                    recordCount: Array.isArray(data) ? data.length : 1,
                    source: metadata.source || 'api',
                    version: '1.0'
                },
                data: data
            };

            await fs.writeFile(filePath, JSON.stringify(record, null, 2));
            
            // Also save as CSV for easy analysis
            if (Array.isArray(data) && data.length > 0) {
                await this.saveAsCSV(dataType, data, metadata);
            }

            console.log(`✅ Saved ${record.metadata.recordCount} records to ${filePath}`);
            return filePath;

        } catch (error) {
            console.error(`❌ Storage error for ${dataType}:`, error);
            throw error;
        }
    }

    async saveAsCSV(dataType, data, metadata = {}) {
        try {
            if (!Array.isArray(data) || data.length === 0) return;

            const timestamp = new Date().toISOString().split('T')[0];
            const csvDir = path.join(this.baseDir, 'csv-exports');
            await fs.mkdir(csvDir, { recursive: true });
            
            const csvPath = path.join(csvDir, `${dataType}_${timestamp}.csv`);
            
            // Extract headers from first record
            const headers = Object.keys(data[0]);
            const csvContent = [
                headers.join(','),
                ...data.map(record => 
                    headers.map(header => {
                        let value = record[header] || '';
                        // Escape commas and quotes in CSV
                        if (typeof value === 'string') {
                            value = value.replace(/"/g, '""');
                            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                                value = `"${value}"`;
                            }
                        }
                        return value;
                    }).join(',')
                )
            ].join('\n');

            await fs.writeFile(csvPath, csvContent);
            console.log(`📊 CSV export saved: ${csvPath}`);

        } catch (error) {
            console.error('CSV export error:', error);
        }
    }

    async loadData(dataType, dateRange = {}) {
        try {
            const typeMap = {
                'competitors': 'competitors',
                'mentions': 'social-media/mentions', 
                'reviews': 'competitors/reviews',
                'rates': 'manual-uploads/rates',
                'bookings': 'manual-uploads/bookings',
                'insights': 'knowledge-base/insights'
            };

            const dir = path.join(this.baseDir, typeMap[dataType] || 'misc');
            const files = await fs.readdir(dir).catch(() => []);
            
            let allData = [];
            
            for (const file of files.filter(f => f.endsWith('.json'))) {
                const filePath = path.join(dir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const record = JSON.parse(content);
                
                // Filter by date range if provided
                if (dateRange.start || dateRange.end) {
                    const recordDate = new Date(record.metadata.timestamp);
                    if (dateRange.start && recordDate < new Date(dateRange.start)) continue;
                    if (dateRange.end && recordDate > new Date(dateRange.end)) continue;
                }
                
                if (Array.isArray(record.data)) {
                    allData.push(...record.data);
                } else {
                    allData.push(record.data);
                }
            }

            return allData;

        } catch (error) {
            console.error(`Error loading ${dataType}:`, error);
            return [];
        }
    }

    async getStorageStats() {
        try {
            const stats = {
                totalFiles: 0,
                totalSize: 0,
                dataTypes: {},
                oldestRecord: null,
                newestRecord: null
            };

            const scanDirectory = async (dir) => {
                try {
                    const items = await fs.readdir(dir, { withFileTypes: true });
                    
                    for (const item of items) {
                        const fullPath = path.join(dir, item.name);
                        
                        if (item.isDirectory()) {
                            await scanDirectory(fullPath);
                        } else if (item.name.endsWith('.json')) {
                            const stat = await fs.stat(fullPath);
                            stats.totalFiles++;
                            stats.totalSize += stat.size;
                            
                            // Track by data type
                            const dataType = item.name.split('_')[0];
                            if (!stats.dataTypes[dataType]) {
                                stats.dataTypes[dataType] = { files: 0, size: 0 };
                            }
                            stats.dataTypes[dataType].files++;
                            stats.dataTypes[dataType].size += stat.size;

                            // Track date range
                            if (!stats.oldestRecord || stat.mtime < stats.oldestRecord) {
                                stats.oldestRecord = stat.mtime;
                            }
                            if (!stats.newestRecord || stat.mtime > stats.newestRecord) {
                                stats.newestRecord = stat.mtime;
                            }
                        }
                    }
                } catch (error) {
                    // Directory doesn't exist yet
                }
            };

            await scanDirectory(this.baseDir);
            
            // Convert bytes to readable format
            stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
            
            return stats;

        } catch (error) {
            console.error('Error getting storage stats:', error);
            return { error: error.message };
        }
    }

    async cleanupOldFiles(daysToKeep = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            let deletedFiles = 0;
            let freedSpace = 0;

            const cleanDirectory = async (dir) => {
                try {
                    const items = await fs.readdir(dir, { withFileTypes: true });
                    
                    for (const item of items) {
                        const fullPath = path.join(dir, item.name);
                        
                        if (item.isDirectory()) {
                            await cleanDirectory(fullPath);
                        } else if (item.name.endsWith('.json') || item.name.endsWith('.csv')) {
                            const stat = await fs.stat(fullPath);
                            
                            if (stat.mtime < cutoffDate) {
                                freedSpace += stat.size;
                                await fs.unlink(fullPath);
                                deletedFiles++;
                            }
                        }
                    }
                } catch (error) {
                    // Directory doesn't exist
                }
            };

            await cleanDirectory(this.baseDir);
            
            return {
                deletedFiles,
                freedSpaceMB: (freedSpace / (1024 * 1024)).toFixed(2)
            };

        } catch (error) {
            console.error('Cleanup error:', error);
            return { error: error.message };
        }
    }

    // Easy migration to database later
    async exportForDatabase() {
        try {
            const exportData = {
                competitors: await this.loadData('competitors'),
                mentions: await this.loadData('mentions'),
                reviews: await this.loadData('reviews'),
                rates: await this.loadData('rates'),
                bookings: await this.loadData('bookings'),
                insights: await this.loadData('insights')
            };

            const exportPath = path.join(this.baseDir, 'database-export.json');
            await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
            
            console.log(`🚀 Database export ready: ${exportPath}`);
            return exportPath;

        } catch (error) {
            console.error('Export error:', error);
            throw error;
        }
    }
}

module.exports = StorageManager;