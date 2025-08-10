// AI-Powered Insights API using Data Intelligence Framework
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Load intelligence context
const loadIntelligenceContext = () => {
  try {
    const contextPath = path.join(process.cwd(), '../../data-upload-tools/pacific_sands_ai_context.txt');
    const intelligencePath = path.join(process.cwd(), '../../data-upload-tools/pacific_sands_data_intelligence.json');
    
    let context = '';
    let intelligence = {};
    
    if (fs.existsSync(contextPath)) {
      context = fs.readFileSync(contextPath, 'utf-8');
    }
    
    if (fs.existsSync(intelligencePath)) {
      intelligence = JSON.parse(fs.readFileSync(intelligencePath, 'utf-8'));
    }
    
    return { context, intelligence };
  } catch (error) {
    console.error('Error loading intelligence:', error);
    return { context: '', intelligence: {} };
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query } = req.query;
  const { context, intelligence } = loadIntelligenceContext();
  
  // Business rules and thresholds
  const businessRules = {
    optimal_occupancy: 0.85,
    weekend_premium: 1.35,
    peak_season_months: [6, 7, 8],
    target_revpar_growth: 0.15,
    critical_occupancy: 0.60,
    premium_rate_threshold: 300
  };
  
  // Generate insights based on intelligence
  const insights = [];
  
  // Analyze each data source
  if (Array.isArray(intelligence)) {
    intelligence.forEach((source: any) => {
      // High relevance data gets priority
      if (source.business_relevance?.rating === 'critical' || source.business_relevance?.rating === 'high') {
        
        // Extract insights from patterns
        if (source.patterns && source.patterns.length > 0) {
          source.patterns.forEach((pattern: string) => {
            insights.push({
              type: 'pattern',
              source: source.filename,
              insight: pattern,
              priority: 'HIGH',
              action: generateActionFromPattern(pattern)
            });
          });
        }
        
        // Check for optimization opportunities
        if (source.key_metrics) {
          const metrics = source.key_metrics;
          
          // Occupancy insights
          if (metrics.avg_occupancy) {
            if (metrics.avg_occupancy < businessRules.critical_occupancy) {
              insights.push({
                type: 'alert',
                source: source.filename,
                insight: `Low occupancy detected: ${(metrics.avg_occupancy * 100).toFixed(1)}%`,
                priority: 'CRITICAL',
                action: 'Implement promotional campaigns and review pricing strategy'
              });
            } else if (metrics.avg_occupancy > 0.90) {
              insights.push({
                type: 'opportunity',
                source: source.filename,
                insight: `High occupancy ${(metrics.avg_occupancy * 100).toFixed(1)}% - pricing power available`,
                priority: 'HIGH',
                action: 'Increase rates by 10-15% to optimize RevPAR'
              });
            }
          }
          
          // Rate insights
          if (metrics.avg_rate) {
            if (metrics.avg_rate < 200) {
              insights.push({
                type: 'warning',
                source: source.filename,
                insight: `Below-market rates detected: $${metrics.avg_rate.toFixed(2)}`,
                priority: 'HIGH',
                action: 'Review competitive positioning and value proposition'
              });
            } else if (metrics.avg_rate > businessRules.premium_rate_threshold) {
              insights.push({
                type: 'success',
                source: source.filename,
                insight: `Premium pricing achieved: $${metrics.avg_rate.toFixed(2)}`,
                priority: 'MEDIUM',
                action: 'Maintain quality standards to justify premium'
              });
            }
          }
          
          // RevPAR insights
          if (metrics.calculated_revpar) {
            insights.push({
              type: 'metric',
              source: source.filename,
              insight: `RevPAR: $${metrics.calculated_revpar.toFixed(2)}`,
              priority: 'HIGH',
              action: metrics.calculated_revpar < 200 ? 
                'Focus on both rate and occupancy improvement' : 
                'Strong performance - maintain strategy'
            });
          }
        }
        
        // Anomaly alerts
        if (source.anomalies && source.anomalies.length > 0) {
          source.anomalies.forEach((anomaly: string) => {
            insights.push({
              type: 'anomaly',
              source: source.filename,
              insight: anomaly,
              priority: 'MEDIUM',
              action: 'Review data quality and investigate unusual patterns'
            });
          });
        }
      }
    });
  }
  
  // Sort insights by priority
  const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // Generate summary
  const summary = {
    total_insights: insights.length,
    critical: insights.filter(i => i.priority === 'CRITICAL').length,
    high: insights.filter(i => i.priority === 'HIGH').length,
    data_sources_analyzed: Array.isArray(intelligence) ? intelligence.length : 0,
    ai_context_available: context.length > 0,
    generated_at: new Date().toISOString()
  };
  
  res.status(200).json({
    success: true,
    summary,
    insights: insights.slice(0, 20), // Top 20 insights
    context_snippet: context.substring(0, 500),
    business_rules: businessRules
  });
}

function generateActionFromPattern(pattern: string): string {
  if (pattern.includes('weekend premium')) {
    const match = pattern.match(/([0-9.]+)%/);
    if (match && parseFloat(match[1]) < 30) {
      return 'Increase weekend rates by additional 10-15%';
    }
    return 'Maintain strong weekend pricing strategy';
  }
  
  if (pattern.includes('occupancy surge')) {
    return 'Capitalize on high demand with dynamic pricing';
  }
  
  if (pattern.includes('peak season')) {
    return 'Prepare premium packages and increase rates for peak period';
  }
  
  return 'Monitor and optimize based on pattern';
}
