# 🤖 Sandy CustomGPT Update Guide - RMS Integration

## 📋 Overview

This guide will help you update Sandy's CustomGPT to include the new RMS Intelligence System endpoints, enabling Sandy to:
- Explain pricing formulas in plain English
- Show current system parameters
- Analyze RMS performance
- Answer natural language queries about the revenue management system

## 🔄 Update Process

### Step 1: Access Sandy's Configuration

1. Go to [ChatGPT](https://chat.openai.com)
2. Navigate to "Explore GPTs" or "My GPTs"
3. Find "Pacific Sands Sandy AI" (or your Sandy GPT)
4. Click "Configure" or "Edit"

### Step 2: Backup Current Configuration

Before making changes:
1. Copy the current "Instructions" to a safe place
2. Download the current schema if one exists
3. Note any custom settings

### Step 3: Update the Schema

1. In the configuration, find the "Actions" section
2. Click on the existing action or "Create new action"
3. Delete the old schema (after backing up)
4. Copy the entire contents of `sandy-openapi-schema-v2.json`
5. Paste into the schema field

### Step 4: Update Authentication

Ensure the authentication is set:
- **Authentication Type**: API Key
- **Auth Type**: Bearer
- **API Key**: `ps_me2w0k3e_x81fsv0yz3k`

### Step 5: Update Instructions

Add these capabilities to Sandy's instructions:

```
## New RMS Intelligence Capabilities

You now have access to the Revenue Management System (RMS) with these new abilities:

### Formula Explanations
- Use `/api/sandy/formulas` to explain pricing formulas
- Can show specific formulas by name or category
- Provides plain English explanations of complex calculations

### System Insights
- Use `/api/sandy/insights` to analyze RMS performance
- Can identify slow formulas, unused rules, and parameter issues
- Generates actionable recommendations

### Natural Language Queries
- Use `/api/sandy/query` to answer questions about the RMS
- Understands queries like "What are the current demand thresholds?"
- Can explain formulas, show parameters, and analyze usage

### ADR Calculations
- Use `/api/rms/calculate/adr` to calculate room rates
- Shows breakdown of all modifiers applied
- Explains which rules affected the calculation

When users ask about pricing, formulas, or revenue management, use these new endpoints to provide accurate, real-time information from the dynamic RMS system.
```

### Step 6: Test the Integration

Test these example prompts:

1. **"What formulas are currently active in the RMS?"**
   - Should use GET `/api/sandy/formulas`
   - Shows list of formulas with categories

2. **"Explain how the baseline ADR formula works"**
   - Should use GET `/api/sandy/formulas?name=baseline_adr&explain=true`
   - Provides detailed explanation

3. **"What are the current demand thresholds?"**
   - Should use POST `/api/sandy/query` with query
   - Shows parameter values

4. **"Calculate ADR for Ocean View room at 85% occupancy"**
   - Should use POST `/api/rms/calculate/adr`
   - Shows calculated rate with breakdown

## 🧪 Verification Tests

### Test 1: Formula Listing
**Prompt**: "Show me all active RMS formulas"

**Expected**: Sandy calls `/api/sandy/formulas` and lists:
- baseline_adr (pricing)
- trevpar_calculation (revenue)
- occupancy_forecast (forecast)
- elasticity_calculation (pricing)
- budget_gap (revenue)

### Test 2: Formula Explanation
**Prompt**: "How does the baseline ADR formula work?"

**Expected**: Detailed explanation including:
- Base historical rate
- Demand modifiers
- Competitor adjustments
- Seasonality factors
- Event premiums

### Test 3: Parameter Query
**Prompt**: "What happens to pricing when occupancy is above 90%?"

**Expected**: Sandy queries and explains:
- Current threshold: +10% modifier
- How it's applied in formulas
- Impact on final ADR

### Test 4: System Status
**Prompt**: "How is the RMS performing today?"

**Expected**: Sandy generates insights about:
- Active formulas and rules
- Recent calculations
- Any performance issues

## 🚨 Troubleshooting

### "Schema validation error"
- Check for any missing commas or brackets
- Ensure all JSON is properly formatted
- Try pasting into a JSON validator first

### "Authentication failed"
- Verify API key is exactly: `ps_me2w0k3e_x81fsv0yz3k`
- Check "Bearer" is selected as auth type
- Ensure no extra spaces in API key

### "Endpoint not found"
- Verify the production URL is correct
- Check that RMS deployment is complete
- Ensure database migration was run

### Sandy doesn't use new endpoints
- Check the instructions include the new capabilities
- Test with more specific prompts
- Verify schema was saved properly

## ✅ Success Checklist

Sandy is properly updated when:
- [ ] Can list all RMS formulas
- [ ] Explains formulas in plain English  
- [ ] Shows current parameter values
- [ ] Calculates ADR with full breakdown
- [ ] Generates insights about system performance
- [ ] Answers natural language RMS queries

## 📝 Quick Reference

### New Endpoints Sandy Can Use:
```
GET  /api/sandy/formulas - Formula explanations
POST /api/sandy/insights - System insights
POST /api/sandy/query - Natural language queries
POST /api/rms/calculate/adr - ADR calculations
```

### Example Sandy Queries:
- "What pricing formulas do we use?"
- "Show me the current demand thresholds"
- "How does seasonality affect our rates?"
- "Calculate rates for high season at 90% occupancy"
- "Are any formulas running slowly?"
- "What rules are currently active?"

## 🎯 New Sandy Capabilities Summary

With this update, Sandy becomes a Revenue Management expert who can:
1. **Explain** - Any formula or rule in simple terms
2. **Calculate** - Real-time pricing with full transparency
3. **Analyze** - System performance and effectiveness
4. **Advise** - Based on current parameters and rules
5. **Monitor** - Formula usage and rule execution

---

**Remember**: After updating, always test with real queries to ensure Sandy is using the new endpoints correctly!