// Enhanced data processing with relationship detection

class DataProcessor {
    constructor() {
        this.datasets = new Map();
        this.relationships = new Map();
        this.enrichments = new Map();
    }

    // Analyze uploaded file to understand structure
    analyzeDataStructure(data, filename) {
        const analysis = {
            filename: filename,
            rowCount: data.length,
            columns: Object.keys(data[0] || {}),
            dataTypes: {},
            patterns: {},
            relationships: [],
            dateRange: null
        };

        // Detect data types and patterns
        analysis.columns.forEach(col => {
            const sample = data.slice(0, 100).map(row => row[col]);
            analysis.dataTypes[col] = this.detectDataType(sample);
            analysis.patterns[col] = this.detectPatterns(sample, analysis.dataTypes[col]);
        });

        // Find date columns and range
        const dateColumns = analysis.columns.filter(col => 
            analysis.dataTypes[col] === 'date'
        );
        
        if (dateColumns.length > 0) {
            const dates = data.map(row => new Date(row[dateColumns[0]]))
                             .filter(d => !isNaN(d));
            if (dates.length > 0) {
                analysis.dateRange = {
                    start: new Date(Math.min(...dates)),
                    end: new Date(Math.max(...dates))
                };
            }
        }

        // Detect potential relationships
        analysis.relationships = this.detectRelationships(analysis.columns, data);

        return analysis;
    }

    // Detect data type from sample values
    detectDataType(sample) {
        const nonEmpty = sample.filter(v => v !== null && v !== '');
        if (nonEmpty.length === 0) return 'unknown';

        // Check for dates
        if (nonEmpty.every(v => !isNaN(Date.parse(v)))) {
            return 'date';
        }

        // Check for numbers
        if (nonEmpty.every(v => !isNaN(parseFloat(v)))) {
            return nonEmpty.some(v => v.toString().includes('.')) ? 'decimal' : 'integer';
        }

        // Check for emails
        if (nonEmpty.some(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {
            return 'email';
        }

        // Check for phone numbers
        if (nonEmpty.some(v => /^[\d\s\-\(\)\+]+$/.test(v) && v.length > 6)) {
            return 'phone';
        }

        return 'text';
    }

    // Detect patterns in data
    detectPatterns(sample, dataType) {
        const patterns = {
            unique: new Set(sample).size === sample.length,
            nullable: sample.some(v => v === null || v === ''),
            format: null
        };

        if (dataType === 'date') {
            // Detect date format
            const formats = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'];
            // Simple format detection logic here
            patterns.format = 'YYYY-MM-DD'; // Default
        }

        if (dataType === 'text') {
            // Check for common patterns
            const uniqueValues = new Set(sample);
            if (uniqueValues.size < 10) {
                patterns.category = Array.from(uniqueValues);
            }
        }

        return patterns;
    }

    // Detect relationships between datasets
    detectRelationships(columns, data) {
        const relationships = [];
        
        // Common relationship patterns
        const keyPatterns = [
            { pattern: /_id$/, type: 'foreign_key' },
            { pattern: /^id$/, type: 'primary_key' },
            { pattern: /_code$/, type: 'reference' },
            { pattern: /^booking_/, type: 'booking_reference' },
            { pattern: /^guest_/, type: 'guest_reference' },
            { pattern: /^room_/, type: 'room_reference' }
        ];

        columns.forEach(col => {
            keyPatterns.forEach(({ pattern, type }) => {
                if (pattern.test(col)) {
                    relationships.push({
                        column: col,
                        type: type,
                        potentialTable: col.replace(/_id$/, '').replace(/^id$/, 'entity')
                    });
                }
            });
        });

        return relationships;
    }

    // Associate data across multiple files
    associateDatasets(primaryData, primaryKey, secondaryData, secondaryKey) {
        const associated = [];
        
        // Create index for faster lookup
        const secondaryIndex = new Map();
        secondaryData.forEach(row => {
            const key = row[secondaryKey];
            if (!secondaryIndex.has(key)) {
                secondaryIndex.set(key, []);
            }
            secondaryIndex.get(key).push(row);
        });

        // Join datasets
        primaryData.forEach(primaryRow => {
            const key = primaryRow[primaryKey];
            const matches = secondaryIndex.get(key) || [];
            
            matches.forEach(secondaryRow => {
                associated.push({
                    ...primaryRow,
                    ...Object.keys(secondaryRow).reduce((acc, k) => {
                        if (k !== secondaryKey) {
                            acc[`linked_${k}`] = secondaryRow[k];
                        }
                        return acc;
                    }, {})
                });
            });
        });

        return associated;
    }

    // Enrich data with calculated fields
    enrichData(data, enrichmentRules) {
        return data.map(row => {
            const enriched = { ...row };

            // Add date-based enrichments
            Object.keys(row).forEach(col => {
                if (this.detectDataType([row[col]]) === 'date') {
                    const date = new Date(row[col]);
                    enriched[`${col}_day_of_week`] = date.toLocaleDateString('en-US', { weekday: 'long' });
                    enriched[`${col}_month`] = date.toLocaleDateString('en-US', { month: 'long' });
                    enriched[`${col}_quarter`] = `Q${Math.floor(date.getMonth() / 3) + 1}`;
                }
            });

            // Add calculated fields
            if (row.check_in && row.check_out) {
                const checkIn = new Date(row.check_in);
                const checkOut = new Date(row.check_out);
                enriched.length_of_stay = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            }

            if (row.rate && row.length_of_stay) {
                enriched.total_revenue = parseFloat(row.rate) * enriched.length_of_stay;
            }

            return enriched;
        });
    }

    // Generate insights from data
    generateInsights(data, analysis) {
        const insights = {
            summary: {
                totalRecords: data.length,
                dateRange: analysis.dateRange,
                columns: analysis.columns.length
            },
            patterns: [],
            anomalies: [],
            recommendations: []
        };

        // Analyze rate patterns
        if (analysis.columns.includes('rate')) {
            const rates = data.map(row => parseFloat(row.rate)).filter(r => !isNaN(r));
            insights.patterns.push({
                type: 'pricing',
                avgRate: (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2),
                minRate: Math.min(...rates),
                maxRate: Math.max(...rates),
                stdDev: this.calculateStdDev(rates).toFixed(2)
            });
        }

        // Analyze occupancy patterns
        if (analysis.columns.includes('check_in')) {
            const dayOfWeekCounts = {};
            data.forEach(row => {
                const day = new Date(row.check_in).toLocaleDateString('en-US', { weekday: 'long' });
                dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + 1;
            });
            
            insights.patterns.push({
                type: 'occupancy_by_day',
                distribution: dayOfWeekCounts
            });
        }

        return insights;
    }

    // Calculate standard deviation
    calculateStdDev(values) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(avgSquareDiff);
    }
}

// Export for use in main upload script
window.DataProcessor = DataProcessor;