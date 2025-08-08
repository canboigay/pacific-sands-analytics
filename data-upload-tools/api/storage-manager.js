// Simplified storage manager for Vercel serverless environment
class StorageManager {
    constructor() {
        // In serverless, we'll use in-memory storage for now
        this.data = {};
    }

    async saveData(dataType, data, metadata = {}) {
        const timestamp = new Date().toISOString();
        const record = {
            dataType,
            data,
            metadata: {
                ...metadata,
                timestamp,
                recordCount: Array.isArray(data) ? data.length : 1
            }
        };

        // Store in memory (in production, this would go to a database)
        if (!this.data[dataType]) {
            this.data[dataType] = [];
        }
        this.data[dataType].push(record);

        console.log(`✅ Stored ${record.metadata.recordCount} ${dataType} records`);
        return `memory://${dataType}/${timestamp}`;
    }

    async loadData(dataType, dateRange = {}) {
        if (!this.data[dataType]) {
            return [];
        }

        let allData = [];
        for (const record of this.data[dataType]) {
            if (Array.isArray(record.data)) {
                allData.push(...record.data);
            } else {
                allData.push(record.data);
            }
        }

        return allData;
    }

    async getStorageStats() {
        const stats = {
            totalRecords: 0,
            dataTypes: {}
        };

        Object.keys(this.data).forEach(dataType => {
            const records = this.data[dataType];
            const count = records.reduce((sum, record) => 
                sum + (record.metadata.recordCount || 0), 0);
            
            stats.dataTypes[dataType] = { records: count };
            stats.totalRecords += count;
        });

        return stats;
    }
}

module.exports = StorageManager;