import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get current date info
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  // Simulate real-time metrics (replace with actual data source)
  const mockMetrics = {
    occupancy: 0.62 + Math.random() * 0.3, // 62-92%
    averageRate: 245 + Math.random() * 80, // $245-325
    pickupADR: 280 + Math.random() * 120, // $280-400
    revpar: 0,
    parityDelta: (Math.random() - 0.5) * 0.04, // -2% to +2%
    bookingPace: Math.random() * 1.2, // 0-120% of target
    cancellationRate: Math.random() * 0.08 // 0-8%
  };
  
  // Calculate RevPAR
  mockMetrics.revpar = mockMetrics.occupancy * mockMetrics.averageRate;
  
  // Generate alerts based on current conditions
  const alerts = [];
  const suggestions = [];
  
  // Check occupancy thresholds
  if (mockMetrics.occupancy < 0.65) {
    alerts.push({
      id: 'occ-critical',
      priority: 'CRITICAL',
      message: 'Occupancy below critical threshold',
      metric: mockMetrics.occupancy,
      threshold: 0.65
    });
  } else if (mockMetrics.occupancy < 0.70) {
    alerts.push({
      id: 'occ-low',
      priority: 'HIGH',
      message: 'Occupancy below target',
      metric: mockMetrics.occupancy,
      threshold: 0.70
    });
  }
  
  // Check for revenue opportunities
  if (mockMetrics.pickupADR > mockMetrics.averageRate + 100) {
    alerts.push({
      id: 'adr-opportunity',
      priority: 'OPPORTUNITY',
      message: 'Strong pickup ADR detected',
      metric: mockMetrics.pickupADR,
      baseline: mockMetrics.averageRate
    });
  }
  
  // Seasonal suggestions
  if (month === 7 && day < 20) {
    suggestions.push({
      id: 'july-soft',
      type: 'SEASONAL',
      message: 'July softness period - consider deeper discounts'
    });
  }
  
  if (month === 9 || month === 10) {
    suggestions.push({
      id: 'peak-season',
      type: 'SEASONAL',
      message: 'Peak season - optimize for revenue'
    });
  }
  
  res.status(200).json({
    timestamp: now.toISOString(),
    metrics: mockMetrics,
    alerts: alerts,
    suggestions: suggestions,
    summary: {
      totalAlerts: alerts.length,
      criticalCount: alerts.filter(a => a.priority === 'CRITICAL').length,
      opportunityCount: alerts.filter(a => a.priority === 'OPPORTUNITY').length
    }
  });
}
