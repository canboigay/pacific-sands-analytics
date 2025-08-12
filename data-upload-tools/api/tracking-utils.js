// Utility for tracking GPT interactions to the dashboard
// Use native fetch in Vercel environment

// Track interaction to the dashboard (fire and forget)
async function trackGPTInteraction(data) {
    try {
        // Don't wait for the response - fire and forget for performance
        fetch('https://frontend-q89qqh65u-pacific-sands.vercel.app/api/gpt-tracking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ps_me2w0k3e_x81fsv0yz3k'
            },
            body: JSON.stringify({
                interactionType: data.type || 'query',
                endpoint: data.endpoint,
                user: 'Sandy',
                requestData: data.request,
                requestSummary: data.requestSummary,
                responseData: data.response,
                responseSummary: data.responseSummary,
                responseTime: data.responseTime,
                dataPoints: data.dataPoints,
                confidence: data.confidence,
                category: data.category,
                tags: data.tags,
                businessValue: data.businessValue,
                actionTaken: data.actionTaken
            })
        }).catch(err => {
            // Silently fail - don't break the main request
            console.error('Tracking failed:', err.message);
        });
    } catch (error) {
        // Silently fail - tracking should never break the main functionality
        console.error('Tracking error:', error.message);
    }
}

// Helper to categorize endpoints
function categorizeEndpoint(endpoint) {
    if (endpoint.includes('analytics')) return 'analytics';
    if (endpoint.includes('forecast')) return 'forecasting';
    if (endpoint.includes('knowledge')) return 'knowledge';
    if (endpoint.includes('health')) return 'system';
    return 'general';
}

// Helper to extract business value
function extractBusinessValue(endpoint, response) {
    const valueMap = {
        'analytics': 'Data-driven decision support',
        'forecasting': 'Revenue optimization planning',
        'knowledge': 'Knowledge base enhancement',
        'competitors': 'Competitive intelligence gathering',
        'insights': 'Strategic business insights'
    };
    
    for (const [key, value] of Object.entries(valueMap)) {
        if (endpoint.includes(key)) return value;
    }
    
    return 'Operational support';
}

// Helper to summarize response
function summarizeResponse(endpoint, response) {
    if (response.recommendations && Array.isArray(response.recommendations)) {
        return `Generated ${response.recommendations.length} recommendations`;
    }
    if (response.forecast && Array.isArray(response.forecast)) {
        return `Forecast generated for ${response.forecast.length} periods`;
    }
    if (response.insights && Array.isArray(response.insights)) {
        return `Retrieved ${response.insights.length} insights`;
    }
    if (response.data_summary) {
        const total = response.data_summary.total_rate_records || response.data_summary.total_occupancy_records || 0;
        return `Analyzed ${total} data points`;
    }
    return 'Data processed successfully';
}

// Helper to count data points
function countDataPoints(response) {
    if (response.data_summary) {
        return (response.data_summary.total_rate_records || 0) + 
               (response.data_summary.total_occupancy_records || 0);
    }
    if (response.recent_data) {
        return (response.recent_data.latest_rates?.length || 0) + 
               (response.recent_data.latest_occupancy?.length || 0);
    }
    if (Array.isArray(response)) {
        return response.length;
    }
    return 0;
}

module.exports = {
    trackGPTInteraction,
    categorizeEndpoint,
    extractBusinessValue,
    summarizeResponse,
    countDataPoints
};