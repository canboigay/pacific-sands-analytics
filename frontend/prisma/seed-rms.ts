import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding RMS formulas, rules, and parameters...');

  // Seed Formulas
  const formulas = [
    {
      name: 'baseline_adr',
      category: 'pricing',
      formulaExpression: 'BASE_ADR * (1 + D1 + D2 + D3 + D4 + M)',
      variables: {
        BASE_ADR: 'Historical average rate by room type/date',
        D1: 'demand_pressure_modifier',
        D2: 'competitor_rate_index',
        D3: 'seasonality_curve',
        D4: 'event_premium',
        M: 'manual_adjustment'
      },
      description: 'Calculates baseline ADR with demand, competitor, seasonality, and event modifiers'
    },
    {
      name: 'trevpar_calculation',
      category: 'revenue',
      formulaExpression: '(ROOM_REVENUE + SPA_REVENUE + FB_REVENUE + RETAIL_REVENUE + ACTIVITIES_REVENUE) / AVAILABLE_ROOM_NIGHTS',
      variables: {
        ROOM_REVENUE: 'Total room revenue',
        SPA_REVENUE: 'Total spa revenue',
        FB_REVENUE: 'Food & beverage revenue',
        RETAIL_REVENUE: 'Retail revenue',
        ACTIVITIES_REVENUE: 'Activities revenue',
        AVAILABLE_ROOM_NIGHTS: 'Total available room nights'
      },
      description: 'Calculates Total Revenue Per Available Room'
    },
    {
      name: 'occupancy_forecast',
      category: 'forecast',
      formulaExpression: 'BASE_OCC * (1 + SEASONAL_FACTOR) * (1 + EVENT_IMPACT) * WEATHER_MULTIPLIER',
      variables: {
        BASE_OCC: 'Historical occupancy for period',
        SEASONAL_FACTOR: 'Seasonality adjustment',
        EVENT_IMPACT: 'Event impact modifier',
        WEATHER_MULTIPLIER: 'Weather-based adjustment'
      },
      description: 'Forecasts occupancy based on historical data and modifiers'
    },
    {
      name: 'elasticity_calculation',
      category: 'pricing',
      formulaExpression: 'abs(PERCENT_CHANGE_OCCUPANCY / PERCENT_CHANGE_RATE)',
      variables: {
        PERCENT_CHANGE_OCCUPANCY: 'Percentage change in occupancy',
        PERCENT_CHANGE_RATE: 'Percentage change in rate'
      },
      description: 'Calculates price elasticity of demand'
    },
    {
      name: 'budget_gap',
      category: 'revenue',
      formulaExpression: '(BUDGET - EXPECTED_REVENUE) / BUDGET',
      variables: {
        BUDGET: 'Budget target',
        EXPECTED_REVENUE: 'Expected revenue based on current pace'
      },
      description: 'Calculates gap between budget and expected revenue as percentage'
    }
  ];

  for (const formula of formulas) {
    await prisma.rMSFormula.upsert({
      where: { name: formula.name },
      update: formula,
      create: formula
    });
  }

  // Seed Rules
  const rules = [
    {
      name: 'high_occupancy_rate_increase',
      ruleType: 'trigger',
      conditions: {
        operator: 'and',
        conditions: [
          { field: 'occupancy', operator: 'greaterThan', value: 90 },
          { field: 'daysOut', operator: 'lessThan', value: 30 }
        ]
      },
      actions: [
        {
          type: 'calculate',
          target: 'recommendedADR',
          formula: 'calculatedADR * 1.1'
        },
        {
          type: 'alert',
          message: 'High occupancy detected: {{occupancy}}% - Recommend 10% rate increase'
        }
      ],
      priority: 100,
      description: 'Triggers rate increase recommendation when occupancy exceeds 90%'
    },
    {
      name: 'low_occupancy_discount',
      ruleType: 'trigger',
      conditions: {
        operator: 'and',
        conditions: [
          { field: 'occupancy', operator: 'lessThan', value: 50 },
          { field: 'daysOut', operator: 'lessThan', value: 14 }
        ]
      },
      actions: [
        {
          type: 'calculate',
          target: 'recommendedADR',
          formula: 'calculatedADR * 0.85'
        },
        {
          type: 'alert',
          message: 'Low occupancy warning: {{occupancy}}% - Recommend 15% discount'
        }
      ],
      priority: 90,
      description: 'Triggers discount recommendation for low occupancy periods'
    },
    {
      name: 'competitor_rate_adjustment',
      ruleType: 'modifier',
      conditions: {
        operator: 'and',
        conditions: [
          { field: 'competitorRateIndex', operator: 'greaterThan', value: 0.1 },
          { field: 'occupancy', operator: 'lessThan', value: 80 }
        ]
      },
      actions: [
        {
          type: 'setValue',
          target: 'rateAdjustment',
          value: -0.05
        }
      ],
      priority: 80,
      description: 'Adjusts rates when significantly above competitors'
    },
    {
      name: 'budget_gap_alert',
      ruleType: 'threshold',
      conditions: {
        operator: 'or',
        conditions: [
          { field: 'budgetGap', operator: 'greaterThan', value: 0.05 },
          { field: 'budgetGap', operator: 'lessThan', value: -0.1 }
        ]
      },
      actions: [
        {
          type: 'alert',
          message: 'Budget variance alert: {{budgetGap}}%'
        },
        {
          type: 'log',
          message: 'Budget gap threshold exceeded'
        }
      ],
      priority: 70,
      description: 'Alerts when budget gap exceeds threshold'
    }
  ];

  for (const rule of rules) {
    await prisma.rMSRule.upsert({
      where: { name: rule.name },
      update: rule,
      create: rule
    });
  }

  // Seed Parameters
  const parameters = [
    // Demand thresholds
    { 
      parameterKey: 'demand_threshold_90_plus',
      parameterValue: 0.10,
      parameterType: 'percentage',
      category: 'demand_thresholds',
      description: 'Price modifier for occupancy > 90%',
      minValue: 0,
      maxValue: 0.5
    },
    { 
      parameterKey: 'demand_threshold_80_90',
      parameterValue: 0.05,
      parameterType: 'percentage',
      category: 'demand_thresholds',
      description: 'Price modifier for occupancy 80-90%',
      minValue: 0,
      maxValue: 0.3
    },
    { 
      parameterKey: 'demand_threshold_60_70',
      parameterValue: -0.05,
      parameterType: 'percentage',
      category: 'demand_thresholds',
      description: 'Price modifier for occupancy 60-70%',
      minValue: -0.3,
      maxValue: 0
    },
    { 
      parameterKey: 'demand_threshold_below_60',
      parameterValue: -0.10,
      parameterType: 'percentage',
      category: 'demand_thresholds',
      description: 'Price modifier for occupancy < 60%',
      minValue: -0.5,
      maxValue: 0
    },

    // Competitor buffers
    { 
      parameterKey: 'competitor_buffer',
      parameterValue: 0.05,
      parameterType: 'percentage',
      category: 'competitor_buffers',
      description: 'Acceptable variance from competitor rates',
      minValue: 0,
      maxValue: 0.2
    },
    { 
      parameterKey: 'competitor_undercut_modifier',
      parameterValue: 0.10,
      parameterType: 'percentage',
      category: 'competitor_buffers',
      description: 'Increase when below competitor rates',
      minValue: 0,
      maxValue: 0.3
    },
    { 
      parameterKey: 'competitor_premium_modifier',
      parameterValue: -0.05,
      parameterType: 'percentage',
      category: 'competitor_buffers',
      description: 'Decrease when above competitor rates',
      minValue: -0.2,
      maxValue: 0
    },

    // Event premiums
    { 
      parameterKey: 'event_premium',
      parameterValue: 0.15,
      parameterType: 'percentage',
      category: 'event_premiums',
      description: 'Default premium for event dates',
      minValue: 0,
      maxValue: 0.5
    },
    { 
      parameterKey: 'major_event_premium',
      parameterValue: 0.25,
      parameterType: 'percentage',
      category: 'event_premiums',
      description: 'Premium for major events',
      minValue: 0,
      maxValue: 0.75
    },

    // Seasonality factors
    { 
      parameterKey: 'seasonality_factors',
      parameterValue: {
        0: -0.15,  // January
        1: -0.10,  // February
        2: -0.05,  // March
        3: 0.00,   // April
        4: 0.05,   // May
        5: 0.15,   // June
        6: 0.20,   // July
        7: 0.20,   // August
        8: 0.10,   // September
        9: 0.05,   // October
        10: -0.05, // November
        11: -0.10  // December
      },
      parameterType: 'object',
      category: 'seasonality',
      description: 'Monthly seasonality adjustments'
    },

    // System parameters
    { 
      parameterKey: 'max_rate_change_daily',
      parameterValue: 0.15,
      parameterType: 'percentage',
      category: 'system',
      description: 'Maximum allowed daily rate change',
      minValue: 0.05,
      maxValue: 0.3
    },
    { 
      parameterKey: 'forecast_horizon_days',
      parameterValue: 365,
      parameterType: 'number',
      category: 'system',
      description: 'Days to forecast ahead',
      minValue: 30,
      maxValue: 730
    }
  ];

  for (const param of parameters) {
    await prisma.rMSParameter.upsert({
      where: { parameterKey: param.parameterKey },
      update: param,
      create: param
    });
  }

  console.log('RMS seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });