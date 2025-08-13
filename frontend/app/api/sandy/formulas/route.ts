import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { FormulaEngine } from '@pacific/formula-engine';

const prisma = new PrismaClient();
const formulaEngine = new FormulaEngine();

// GET /api/sandy/formulas - Get formula explanations for Sandy AI
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const formulaName = searchParams.get('name');
    const explain = searchParams.get('explain') === 'true';

    // Verify Sandy API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ps_')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let formulas;

    if (formulaName) {
      // Get specific formula
      const formula = await prisma.rMSFormula.findUnique({
        where: { name: formulaName, isActive: true },
        include: {
          _count: {
            select: { calculations: true }
          }
        }
      });

      if (!formula) {
        return NextResponse.json(
          { success: false, error: 'Formula not found' },
          { status: 404 }
        );
      }

      formulas = [formula];
    } else {
      // Get all formulas
      const where: any = { isActive: true };
      if (category) where.category = category;

      formulas = await prisma.rMSFormula.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { calculations: true }
          }
        }
      });
    }

    // Transform formulas for Sandy
    const transformedFormulas = formulas.map(formula => {
      const transformed: any = {
        name: formula.name,
        category: formula.category,
        description: formula.description,
        usageCount: formula._count.calculations,
        variables: formula.variables
      };

      if (explain) {
        // Generate plain English explanation
        transformed.explanation = generateExplanation(formula);
        transformed.complexity = formulaEngine.analyzeComplexity(formula.formulaExpression);
      }

      return transformed;
    });

    return NextResponse.json({
      success: true,
      data: formulaName ? transformedFormulas[0] : transformedFormulas,
      count: transformedFormulas.length,
      categories: await getFormulaCategories()
    });

  } catch (error: any) {
    console.error('Error fetching formulas for Sandy:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function generateExplanation(formula: any): string {
  const explanations: Record<string, string> = {
    baseline_adr: `This formula calculates the Average Daily Rate (ADR) by starting with the historical average rate and applying multiple modifiers:
- Demand Pressure (D1): Adjusts price based on current occupancy levels
- Competitor Index (D2): Compares our rates to competitors and adjusts accordingly  
- Seasonality (D3): Applies seasonal adjustments based on time of year
- Event Premium (D4): Adds premiums for special events or peak dates
- Manual Adjustment (M): Allows revenue managers to apply manual overrides

The formula multiplies the base rate by (1 + sum of all modifiers) to get the final recommended ADR.`,

    trevpar_calculation: `Total Revenue Per Available Room (TRevPAR) measures the total revenue generated across all departments divided by available room nights. It includes:
- Room Revenue: Direct revenue from room sales
- Spa Revenue: Income from spa services
- F&B Revenue: Food and beverage sales
- Retail Revenue: Gift shop and retail sales
- Activities Revenue: Tours, activities, and experiences

This gives a complete picture of revenue generation beyond just room rates.`,

    occupancy_forecast: `Forecasts future occupancy by analyzing:
- Historical occupancy patterns for the same period
- Seasonal factors that affect demand
- Impact of known events in the area
- Weather patterns and their effect on bookings

The forecast helps predict demand and optimize pricing strategies.`,

    elasticity_calculation: `Price elasticity measures how sensitive demand is to price changes. It calculates the percentage change in occupancy divided by the percentage change in rate. 
- Elasticity > 1: Demand is elastic (small price changes have big impact)
- Elasticity < 1: Demand is inelastic (price changes have less impact)

This helps determine optimal pricing strategies.`,

    budget_gap: `Calculates the variance between budgeted revenue and expected revenue based on current pace. It shows:
- Positive gap: Expected revenue is below budget (action needed)
- Negative gap: Expected revenue exceeds budget (opportunity to optimize)

This helps revenue managers take corrective action early.`
  };

  return explanations[formula.name] || `This formula ${formula.description || 'performs calculations for the RMS system'}.`;
}

async function getFormulaCategories() {
  const categories = await prisma.rMSFormula.groupBy({
    by: ['category'],
    where: { isActive: true },
    _count: true
  });

  return categories.map(cat => ({
    name: cat.category,
    count: cat._count
  }));
}