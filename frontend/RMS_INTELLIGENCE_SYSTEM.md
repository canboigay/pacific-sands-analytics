# Pacific Sands RMS Intelligence System

## 🎯 Overview

The Pacific Sands RMS Intelligence System is a **fully dynamic, database-driven** revenue management platform where ALL business logic, formulas, and rules are stored in the database and can be modified through an admin console without any code changes.

## 🏗️ Architecture

### Core Principles
1. **NO HARDCODED LOGIC** - Everything is dynamic and stored in the database
2. **REAL-TIME UPDATES** - Changes take effect immediately without deployment
3. **COMPLETE AUDIT TRAIL** - Every change and calculation is logged
4. **VERSION CONTROL** - Formula changes are versioned with rollback capability
5. **AI INTEGRATION** - Sandy AI can explain and analyze all formulas/rules

### System Components

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Admin Console     │────▶│   Database Layer    │◀────│    RMS Platform     │
│  (Formula Editor)   │     │  (Source of Truth)  │     │ (Executes Formulas) │
└─────────────────────┘     └──────────┬──────────┘     └─────────────────────┘
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │     Sandy AI        │
                            │ (Explains Formulas) │
                            └─────────────────────┘
```

## 📊 Database Schema

### Core Tables

1. **RMSFormula** - Stores all dynamic formulas
   - `formulaExpression`: The actual formula as a string
   - `variables`: JSON object describing required variables
   - `version`: Version number for tracking changes
   - Full audit trail with created/updated timestamps

2. **RMSRule** - Business rules engine
   - `conditions`: JSON structure for rule conditions
   - `actions`: JSON array of actions to execute
   - `priority`: Execution order (higher = first)

3. **RMSParameter** - Configurable parameters
   - `parameterValue`: JSON value (can be any type)
   - `minValue`/`maxValue`: Validation boundaries
   - Category-based organization

4. **RMSCalculation** - Audit trail of all calculations
5. **RMSRuleExecution** - Audit trail of rule executions
6. **RMSFormulaVersion** - Version history for formulas
7. **RMSFormulaTest** - Test cases and results

## 🔧 API Endpoints

### Admin Console APIs

#### Formula Management
```
GET    /api/admin/formulas              # List all formulas
POST   /api/admin/formulas              # Create new formula
GET    /api/admin/formulas/[id]         # Get formula details
PUT    /api/admin/formulas/[id]         # Update formula
DELETE /api/admin/formulas/[id]         # Delete/deactivate formula
POST   /api/admin/formulas/[id]/test    # Test formula with sample data
```

#### Rule Management
```
GET    /api/admin/rules                 # List all rules
POST   /api/admin/rules                 # Create new rule
GET    /api/admin/rules/[id]            # Get rule details
PUT    /api/admin/rules/[id]            # Update rule
DELETE /api/admin/rules/[id]            # Delete/deactivate rule
POST   /api/admin/rules/evaluate        # Test rule evaluation
```

#### Parameter Management
```
GET    /api/admin/parameters            # Get all parameters
POST   /api/admin/parameters            # Create parameter
PUT    /api/admin/parameters/bulk       # Bulk update
POST   /api/admin/parameters/import     # Import from CSV/JSON
GET    /api/admin/parameters/export     # Export to CSV/JSON
```

### RMS Platform APIs

```
POST   /api/rms/calculate/adr           # Calculate ADR using DB formulas
POST   /api/rms/calculate/trevpar       # Calculate TRevPAR
POST   /api/rms/calculate/forecast      # Generate occupancy forecast
GET    /api/rms/recommendations        # Get pricing recommendations
```

### Sandy AI APIs

```
GET    /api/sandy/formulas              # Get formula explanations
POST   /api/sandy/insights              # Generate system insights
POST   /api/sandy/query                 # Natural language queries
```

## 📝 Dynamic Formulas

### Example: Baseline ADR Formula

Stored in database as:
```javascript
{
  "name": "baseline_adr",
  "formulaExpression": "BASE_ADR * (1 + D1 + D2 + D3 + D4 + M)",
  "variables": {
    "BASE_ADR": "Historical average rate",
    "D1": "Demand pressure modifier",
    "D2": "Competitor rate index",
    "D3": "Seasonality curve",
    "D4": "Event premium",
    "M": "Manual adjustment"
  }
}
```

### How It Works

1. **API Request** comes in to calculate ADR
2. **Fetch Formula** from database (always current version)
3. **Fetch Parameters** from database (demand thresholds, etc.)
4. **Gather Input Data** (occupancy, competitor rates, etc.)
5. **Execute Formula** using FormulaEngine
6. **Apply Rules** using RulesEngine
7. **Log Calculation** for audit trail
8. **Return Result** with full transparency

## 🎛️ Dynamic Parameters

### Categories

- **demand_thresholds**: Occupancy-based price modifiers
- **competitor_buffers**: Acceptable variance from competitors
- **event_premiums**: Premiums for special events
- **seasonality**: Monthly adjustment factors
- **system**: System-wide settings

### Example Parameters

```json
{
  "demand_threshold_90_plus": 0.10,      // +10% when occupancy > 90%
  "demand_threshold_80_90": 0.05,        // +5% when occupancy 80-90%
  "competitor_buffer": 0.05,             // 5% acceptable variance
  "event_premium": 0.15,                 // 15% premium for events
  "max_rate_change_daily": 0.15          // Max 15% daily change
}
```

## 🔄 Business Rules

### Rule Types

1. **Triggers** - Initiate actions based on conditions
2. **Modifiers** - Adjust values during calculations
3. **Thresholds** - Alert when limits are exceeded

### Example Rule

```json
{
  "name": "high_occupancy_rate_increase",
  "conditions": {
    "operator": "and",
    "conditions": [
      { "field": "occupancy", "operator": "greaterThan", "value": 90 },
      { "field": "daysOut", "operator": "lessThan", "value": 30 }
    ]
  },
  "actions": [
    {
      "type": "calculate",
      "target": "recommendedADR",
      "formula": "calculatedADR * 1.1"
    },
    {
      "type": "alert",
      "message": "High occupancy {{occupancy}}% - Increase rates"
    }
  ]
}
```

## 🚀 Getting Started

### Installation

```bash
# From the frontend directory
./setup-rms.sh
```

This will:
- Install all dependencies
- Build formula and rules engines
- Run database migrations
- Seed initial formulas and parameters

### Testing a Formula

```bash
# Test the baseline ADR formula
curl -X POST http://localhost:3000/api/admin/formulas/[formula-id]/test \
  -H "Content-Type: application/json" \
  -d '{
    "testData": {
      "BASE_ADR": 200,
      "occupancy": 85,
      "competitorRates": [180, 195, 210],
      "date": "2024-07-15"
    }
  }'
```

### Updating a Parameter

```bash
# Update demand threshold
curl -X PUT http://localhost:3000/api/admin/parameters/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [{
      "parameterKey": "demand_threshold_90_plus",
      "parameterValue": 0.12
    }],
    "updatedBy": "revenue_manager"
  }'
```

## 🤖 Sandy AI Integration

Sandy can:
1. **Explain Formulas** in plain English
2. **Show Current Parameters** and their effects
3. **Analyze Performance** of formulas and rules
4. **Suggest Optimizations** based on usage patterns
5. **Alert on Anomalies** in calculations

Example Sandy queries:
- "Explain the baseline ADR formula"
- "What are the current demand thresholds?"
- "Show me formula usage for the last week"
- "Which rules are matching most often?"

## 📈 Monitoring & Analytics

### Key Metrics

1. **Formula Performance**
   - Execution time
   - Usage frequency
   - Error rates

2. **Rule Effectiveness**
   - Match rate
   - Action success rate
   - Business impact

3. **Parameter Optimization**
   - Parameters at limits
   - Frequently changed parameters
   - Impact analysis

### Audit Trail

Every calculation and change is logged:
- Who made the change
- When it was made
- What was changed
- Why (change reason)
- Previous values

## 🔐 Security

1. **API Authentication** - Bearer token required
2. **Role-Based Access** - Admin, Revenue Manager, Analyst
3. **Input Validation** - All formulas validated before saving
4. **SQL Injection Protection** - Safe formula execution
5. **Rate Limiting** - Prevent abuse

## 🎯 Best Practices

1. **Test Before Production** - Always test formulas with sample data
2. **Document Changes** - Provide clear change reasons
3. **Monitor Performance** - Watch execution times
4. **Regular Reviews** - Review unused rules/formulas
5. **Incremental Changes** - Make small adjustments

## 🚨 Troubleshooting

### Common Issues

1. **Formula Won't Save**
   - Check syntax with validator
   - Ensure all variables are defined
   - Verify no disallowed functions

2. **Rule Not Matching**
   - Check field names in conditions
   - Verify data types match
   - Test with evaluation endpoint

3. **Slow Calculations**
   - Check formula complexity
   - Optimize nested conditions
   - Consider caching

### Debug Mode

Enable detailed logging:
```javascript
// In API calls, add debug flag
{
  "debug": true,
  "testData": { ... }
}
```

## 📚 Further Reading

- Formula Engine Documentation: `/packages/@pacific/formula-engine/README.md`
- Rules Engine Documentation: `/packages/@pacific/rules-engine/README.md`
- API Reference: `/docs/api-reference.md`

---

**Remember**: The database is the single source of truth. Never hardcode formulas or rules in the application code!