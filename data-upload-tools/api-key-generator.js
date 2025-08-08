// Simple API Key Generator for Custom GPT Integration

function generateAPIKey() {
    const prefix = 'ps_'; // Pacific Sands prefix
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return prefix + timestamp + '_' + random;
}

function createAPIKeyConfig() {
    const apiKey = generateAPIKey();
    
    const config = {
        api_key: apiKey,
        created_at: new Date().toISOString(),
        permissions: [
            "upload_data",
            "query_analytics", 
            "get_insights",
            "competitor_analysis"
        ],
        rate_limit: {
            requests_per_hour: 100,
            requests_per_day: 1000
        },
        description: "Pacific Sands Custom GPT Integration Key"
    };
    
    console.log('Generated API Key Configuration:');
    console.log(JSON.stringify(config, null, 2));
    
    return config;
}

// Generate your API key
const keyConfig = createAPIKeyConfig();

// For Custom GPT Actions, you'll use this format:
console.log('\n=== For Custom GPT Actions Configuration ===');
console.log('Authentication Type: API Key');
console.log('API Key:', keyConfig.api_key);
console.log('Auth Type: Bearer Token');
console.log('Header Name: Authorization');
console.log('Header Value: Bearer ' + keyConfig.api_key);