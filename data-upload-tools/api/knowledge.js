// Knowledge management endpoints for Pacific Sands GPT
const { PrismaClient } = require('@prisma/client');

let prisma;
if (!global.prisma) {
    global.prisma = new PrismaClient();
}
prisma = global.prisma;

// API Key authentication
const authenticateAPI = (req) => {
    const authHeader = req.headers.authorization;
    const validKey = 'Bearer ps_me2w0k3e_x81fsv0yz3k';
    return authHeader === validKey;
};

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!authenticateAPI(req)) {
        return res.status(401).json({ error: 'Invalid API key' });
    }

    const { action } = req.query;

    try {
        if (req.method === 'POST' && action === 'store') {
            return await storeInsight(req, res);
        } else if (req.method === 'GET' && action === 'retrieve') {
            return await retrieveInsights(req, res);
        } else if (req.method === 'GET' && action === 'synthesis') {
            return await getSynthesizedInsights(req, res);
        }

        return res.status(404).json({ error: 'Action not found' });

    } catch (error) {
        console.error('Knowledge management error:', error);
        return res.status(500).json({
            error: 'Knowledge management failed',
            details: error.message
        });
    }
};

async function storeInsight(req, res) {
    try {
        const { 
            insight_type, 
            title, 
            content, 
            confidence_level = 0.7, 
            data_sources = [], 
            tags = [], 
            date_range 
        } = req.body;

        if (!title || !content) {
            return res.status(400).json({ 
                error: 'Missing required fields: title, content' 
            });
        }

        // Validate insight type
        const validTypes = [
            'customer_insight', 
            'market_observation', 
            'operational_finding', 
            'strategic_recommendation', 
            'trend_analysis', 
            'competitive_intelligence'
        ];

        if (insight_type && !validTypes.includes(insight_type)) {
            return res.status(400).json({
                error: `Invalid insight_type. Must be one of: ${validTypes.join(', ')}`
            });
        }

        // Store the insight
        const insight = await prisma.insight.create({
            data: {
                text: `${title}: ${content}`,
                source: 'gpt_custom',
                confidence: parseFloat(confidence_level),
                impact: determineImpact(insight_type, confidence_level),
                metadata: {
                    insight_type: insight_type || 'general',
                    title,
                    content,
                    data_sources,
                    tags,
                    date_range,
                    stored_by: 'custom_gpt'
                }
            }
        });

        return res.json({
            success: true,
            insight_id: insight.id.toString(),
            message: 'Insight stored successfully',
            stored_data: {
                type: insight_type || 'general',
                title,
                confidence_level: parseFloat(confidence_level),
                tags
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Store insight error:', error);
        return res.status(500).json({ 
            error: 'Failed to store insight', 
            details: error.message 
        });
    }
}

async function retrieveInsights(req, res) {
    try {
        const { search_query, insight_type, tags, limit = 20 } = req.query;

        // Build search conditions
        const whereConditions = [];

        if (search_query) {
            whereConditions.push({
                text: {
                    contains: search_query,
                    mode: 'insensitive'
                }
            });
        }

        if (insight_type) {
            whereConditions.push({
                metadata: {
                    path: ['insight_type'],
                    equals: insight_type
                }
            });
        }

        if (tags) {
            const tagList = tags.split(',').map(tag => tag.trim());
            tagList.forEach(tag => {
                whereConditions.push({
                    metadata: {
                        path: ['tags'],
                        array_contains: tag
                    }
                });
            });
        }

        // Fetch insights
        const insights = await prisma.insight.findMany({
            where: whereConditions.length > 0 ? { AND: whereConditions } : {},
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        // Format response
        const formattedInsights = insights.map(insight => ({
            id: insight.id.toString(),
            title: insight.metadata?.title || insight.text.substring(0, 50) + '...',
            content: insight.metadata?.content || insight.text,
            insight_type: insight.metadata?.insight_type || 'general',
            confidence_level: insight.confidence,
            impact: insight.impact,
            tags: insight.metadata?.tags || [],
            data_sources: insight.metadata?.data_sources || [],
            created_at: insight.createdAt.toISOString(),
            source: insight.source
        }));

        return res.json({
            insights: formattedInsights,
            total_found: formattedInsights.length,
            search_parameters: {
                search_query: search_query || null,
                insight_type: insight_type || null,
                tags: tags ? tags.split(',').map(t => t.trim()) : null
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Retrieve insights error:', error);
        return res.status(500).json({ 
            error: 'Failed to retrieve insights', 
            details: error.message 
        });
    }
}

async function getSynthesizedInsights(req, res) {
    try {
        const { focus_area, time_period = '90days' } = req.query;

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        switch (time_period) {
            case '30days':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90days':
                startDate.setDate(startDate.getDate() - 90);
                break;
            case '6months':
                startDate.setMonth(startDate.getMonth() - 6);
                break;
            case '1year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(startDate.getDate() - 90);
        }

        // Get comprehensive data for synthesis
        const [insights, rateStats, occupancyStats, uploads] = await Promise.all([
            prisma.insight.findMany({
                where: {
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: { confidence: 'desc' }
            }),
            prisma.rateRecord.aggregate({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                _avg: { rate: true },
                _min: { rate: true },
                _max: { rate: true },
                _count: true
            }),
            prisma.occupancyRecord.aggregate({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                _avg: { occupancyRate: true },
                _count: true
            }),
            prisma.uploadMetadata.findMany({
                where: {
                    uploadedAt: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                orderBy: { uploadedAt: 'desc' }
            })
        ]);

        // Generate executive summary
        const avgRate = rateStats._avg.rate || 0;
        const avgOccupancy = occupancyStats._avg.occupancyRate || 0;
        const totalInsights = insights.length;
        const highConfidenceInsights = insights.filter(i => i.confidence > 0.8).length;

        let executiveSummary = `Analysis for ${time_period}: `;
        executiveSummary += `Average rate: $${avgRate.toFixed(2)}, `;
        executiveSummary += `Average occupancy: ${avgOccupancy.toFixed(1)}%, `;
        executiveSummary += `${totalInsights} insights generated with ${highConfidenceInsights} high-confidence findings.`;

        // Key findings based on focus area
        let keyFindings = [];
        
        if (focus_area === 'customer_experience') {
            keyFindings = insights
                .filter(i => i.metadata?.insight_type === 'customer_insight' || 
                           i.text.toLowerCase().includes('customer') ||
                           i.text.toLowerCase().includes('review'))
                .slice(0, 5)
                .map(insight => ({
                    title: insight.metadata?.title || 'Customer Experience Insight',
                    description: insight.text,
                    confidence: insight.confidence,
                    impact: insight.impact
                }));
        } else if (focus_area === 'competitive_position') {
            keyFindings = insights
                .filter(i => i.metadata?.insight_type === 'competitive_intelligence' ||
                           i.text.toLowerCase().includes('competitor'))
                .slice(0, 5)
                .map(insight => ({
                    title: insight.metadata?.title || 'Competitive Analysis',
                    description: insight.text,
                    confidence: insight.confidence,
                    impact: insight.impact
                }));
        } else if (focus_area === 'revenue_optimization') {
            keyFindings = [
                {
                    title: 'Rate Performance',
                    description: `Average rate of $${avgRate.toFixed(2)} with ${rateStats._count} data points`,
                    confidence: rateStats._count > 50 ? 0.9 : 0.6,
                    impact: 'high'
                },
                {
                    title: 'Occupancy Performance', 
                    description: `Average occupancy of ${avgOccupancy.toFixed(1)}% suggests ${avgOccupancy > 80 ? 'strong demand' : 'optimization opportunities'}`,
                    confidence: 0.8,
                    impact: avgOccupancy > 80 ? 'high' : 'medium'
                }
            ];
        } else {
            // General findings
            keyFindings = insights
                .slice(0, 5)
                .map(insight => ({
                    title: insight.metadata?.title || 'General Insight',
                    description: insight.text,
                    confidence: insight.confidence,
                    impact: insight.impact
                }));
        }

        // Generate recommendations
        const recommendations = [
            {
                title: 'Data Collection',
                description: `${uploads.length} data uploads in period. ${uploads.length < 5 ? 'Increase data collection frequency for better insights.' : 'Good data collection rhythm maintained.'}`,
                priority: uploads.length < 5 ? 'high' : 'medium',
                impact: 'medium'
            }
        ];

        if (avgOccupancy > 0) {
            if (avgOccupancy > 85) {
                recommendations.push({
                    title: 'Rate Optimization',
                    description: 'High occupancy suggests opportunity for rate increases',
                    priority: 'high',
                    impact: 'high'
                });
            } else if (avgOccupancy < 60) {
                recommendations.push({
                    title: 'Demand Generation',
                    description: 'Low occupancy indicates need for marketing and pricing strategy review',
                    priority: 'high', 
                    impact: 'high'
                });
            }
        }

        const response = {
            time_period,
            focus_area: focus_area || 'general',
            executive_summary: executiveSummary,
            data_summary: {
                insights_analyzed: totalInsights,
                high_confidence_insights: highConfidenceInsights,
                rate_data_points: rateStats._count,
                occupancy_data_points: occupancyStats._count,
                data_uploads: uploads.length
            },
            key_findings: keyFindings,
            recommendations,
            performance_metrics: {
                average_rate: avgRate,
                rate_range: {
                    min: rateStats._min.rate || 0,
                    max: rateStats._max.rate || 0
                },
                average_occupancy: avgOccupancy,
                data_quality_score: Math.min(1.0, (rateStats._count + occupancyStats._count) / 100)
            },
            timestamp: new Date().toISOString()
        };

        return res.json(response);

    } catch (error) {
        console.error('Synthesis error:', error);
        return res.status(500).json({ 
            error: 'Failed to generate synthesis', 
            details: error.message 
        });
    }
}

function determineImpact(insightType, confidence) {
    if (confidence > 0.8) {
        if (['strategic_recommendation', 'competitive_intelligence'].includes(insightType)) {
            return 'high';
        }
        return 'medium';
    } else if (confidence > 0.6) {
        return 'medium';
    }
    return 'low';
}
