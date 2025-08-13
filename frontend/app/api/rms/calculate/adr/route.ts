import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { FormulaEngine } from '@pacific/formula-engine';
import { RulesEngine } from '@pacific/rules-engine';

const prisma = new PrismaClient();
const formulaEngine = new FormulaEngine();
const rulesEngine = new RulesEngine();

// POST /api/rms/calculate/adr - Calculate ADR using dynamic formulas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, roomType, occupancy, competitorRates, eventDates, manualAdjustment } = body;

    // Fetch the baseline ADR formula
    const baselineFormula = await prisma.rMSFormula.findUnique({
      where: { name: 'baseline_adr', isActive: true }
    });

    if (!baselineFormula) {
      return NextResponse.json(
        { success: false, error: 'Baseline ADR formula not found' },
        { status: 404 }
      );
    }

    // Fetch all required parameters
    const parameters = await prisma.rMSParameter.findMany({
      where: {
        category: { in: ['pricing', 'demand_thresholds', 'competitor_buffers'] }
      }
    });

    // Convert parameters to key-value map
    const paramMap = parameters.reduce((acc, param) => {
      acc[param.parameterKey] = param.parameterValue;
      return acc;
    }, {} as Record<string, any>);

    // Get historical ADR for base calculation
    const historicalData = await getHistoricalADR(date, roomType);

    // Calculate demand modifier (D1) based on occupancy
    const demandModifier = calculateDemandModifier(occupancy, paramMap);

    // Calculate competitor rate index (D2)
    const competitorIndex = await calculateCompetitorIndex(
      competitorRates,
      historicalData.avgRate,
      paramMap
    );

    // Calculate seasonality curve (D3)
    const seasonalityModifier = await calculateSeasonality(date, paramMap);

    // Calculate event premium (D4)
    const eventPremium = calculateEventPremium(date, eventDates, paramMap);

    // Prepare context for formula execution
    const context = {
      variables: {
        BASE_ADR: historicalData.avgRate,
        D1: demandModifier,
        D2: competitorIndex,
        D3: seasonalityModifier,
        D4: eventPremium,
        M: manualAdjustment || 0,
        occupancy,
        date,
        roomType
      },
      parameters: paramMap
    };

    // Execute the formula
    const result = await formulaEngine.execute(
      baselineFormula.formulaExpression,
      context
    );

    if (result.errors && result.errors.length > 0) {
      return NextResponse.json(
        { success: false, errors: result.errors },
        { status: 400 }
      );
    }

    // Apply business rules
    const rulesContext = {
      data: {
        calculatedADR: result.value,
        ...context.variables
      }
    };

    const applicableRules = await prisma.rMSRule.findMany({
      where: {
        ruleType: 'modifier',
        isActive: true
      }
    });

    const rulesResult = await rulesEngine.evaluateRules(
      applicableRules,
      rulesContext,
      { executeActions: true }
    );

    // Get final ADR after rules
    const finalADR = rulesContext.data.calculatedADR;

    // Log calculation for audit
    await prisma.rMSCalculation.create({
      data: {
        formulaId: baselineFormula.id,
        inputValues: context.variables,
        outputValue: {
          initialADR: result.value,
          finalADR,
          rulesApplied: rulesResult.matchedRules
        },
        executionTime: result.executionTime,
        metadata: {
          date,
          roomType,
          modifiers: {
            demand: demandModifier,
            competitor: competitorIndex,
            seasonality: seasonalityModifier,
            event: eventPremium,
            manual: manualAdjustment || 0
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        adr: Math.round(finalADR * 100) / 100,
        breakdown: {
          baseADR: historicalData.avgRate,
          demandModifier: demandModifier,
          competitorIndex: competitorIndex,
          seasonalityModifier: seasonalityModifier,
          eventPremium: eventPremium,
          manualAdjustment: manualAdjustment || 0,
          totalModifier: demandModifier + competitorIndex + seasonalityModifier + eventPremium + (manualAdjustment || 0)
        },
        formula: {
          name: baselineFormula.name,
          expression: baselineFormula.formulaExpression,
          version: baselineFormula.version
        },
        rulesApplied: rulesResult.results
          .filter(r => r.matched)
          .map(r => ({ id: r.ruleId, name: r.ruleName })),
        executionTime: result.executionTime
      }
    });

  } catch (error: any) {
    console.error('Error calculating ADR:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function getHistoricalADR(date: Date, roomType: string) {
  // Get historical data for same day of week, same month, last 3 years
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay();
  const month = targetDate.getMonth();

  const historicalData = await prisma.paceReport.aggregate({
    where: {
      roomType,
      dayOfWeek,
      reportDate: {
        gte: new Date(targetDate.getFullYear() - 3, 0, 1),
        lt: targetDate
      },
      AND: [
        { reportDate: { gte: new Date(targetDate.getFullYear() - 3, month, 1) } },
        { reportDate: { lt: new Date(targetDate.getFullYear() - 3, month + 1, 1) } }
      ]
    },
    _avg: {
      adr: true
    }
  });

  return {
    avgRate: historicalData._avg.adr || 200 // Default fallback
  };
}

function calculateDemandModifier(occupancy: number, parameters: Record<string, any>): number {
  const thresholds = parameters.demand_thresholds || {
    '90_plus': 0.10,
    '80_90': 0.05,
    '60_70': -0.05,
    'below_60': -0.10
  };

  if (occupancy > 90) return thresholds['90_plus'];
  if (occupancy >= 80 && occupancy <= 90) return thresholds['80_90'];
  if (occupancy >= 60 && occupancy < 70) return thresholds['60_70'];
  if (occupancy < 60) return thresholds['below_60'];
  
  return 0;
}

async function calculateCompetitorIndex(
  competitorRates: number[],
  ourRate: number,
  parameters: Record<string, any>
): Promise<number> {
  if (!competitorRates || competitorRates.length === 0) return 0;

  const avgCompRate = competitorRates.reduce((a, b) => a + b, 0) / competitorRates.length;
  const buffer = parameters.competitor_buffer || 0.05;

  if (ourRate < avgCompRate * (1 - buffer)) {
    return parameters.competitor_undercut_modifier || 0.10;
  } else if (ourRate > avgCompRate * (1 + buffer)) {
    return parameters.competitor_premium_modifier || -0.05;
  }

  return 0;
}

async function calculateSeasonality(date: Date, parameters: Record<string, any>): Promise<number> {
  const month = new Date(date).getMonth();
  const seasonalityFactors = parameters.seasonality_factors || {
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
  };

  return seasonalityFactors[month] || 0;
}

function calculateEventPremium(
  date: Date,
  eventDates: string[],
  parameters: Record<string, any>
): number {
  if (!eventDates || eventDates.length === 0) return 0;

  const dateStr = new Date(date).toISOString().split('T')[0];
  const isEventDate = eventDates.includes(dateStr);

  return isEventDate ? (parameters.event_premium || 0.15) : 0;
}