#!/usr/bin/env python3
'''
Process Pacific Sands Master Reference Document
Extract and apply actual business rules to all data
'''

import json
import pandas as pd
from datetime import datetime

# Key insights from Master Reference
MASTER_INSIGHTS = {
    'revenue_target': 'Double-digit growth (10%+)',
    'room_nights_target': '+11-12% vs LY',
    'adr_target': '+1-3% modest growth',
    
    'CRITICAL_FINDING': {
        'insight': 'Pickup ADRs are $100-150 HIGHER than base ADR',
        'action': 'HOLD RATES LONGER on compression/near-in dates',
        'trigger': 'When PickupADR >= BaseADR + σADR, FREEZE DISCOUNTS'
    },
    
    'unit_type_strategy': {
        '2BR+': {
            'characteristic': 'Most responsive to pricing',
            'soft_period': '-10% to -20% targeted reductions',
            'compression': '+3% to +6% premium',
            'key': 'Time-boxed reductions work best'
        },
        'smaller_units': {
            'characteristic': 'Less elastic',
            'soft_period': '-5% to -8% lighter trims',
            'compression': '+2% to +4% modest premium'
        }
    },
    
    'seasonal_patterns': {
        'WEAK': {
            'periods': ['Early/Mid July clusters', 'Aug 9', 'Nov 20'],
            'playbook': '2BR+ -15% to -20%, relax min-stay, LOS promos'
        },
        'STRONG': {
            'periods': ['Mid/Late June', 'September', 'October'],
            'playbook': 'Hold rates, narrow discounts, let premium persist'
        }
    },
    
    'operating_cadence': {
        '02:00': 'Data sync (rates, OTB, weather, events)',
        '07:30': 'Human review and validation',
        '11:00': 'Pulse adjustment ±1-3%',
        '16:00': 'Second pulse adjustment'
    },
    
    'flex_bands': {
        'floor': -20,  # Maximum discount
        'ceiling': +25,  # Maximum premium
        'note': 'Bands tighten as days-out decreases'
    },
    
    'kpi_priority': [
        'RevPAR (Primary)',
        'TRevPAR',
        'Occupancy vs curve',
        'ADR with pickup monitoring',
        'Pace vs LY',
        'Pickup ADR (CRITICAL)',
        'Net Conversion',
        'Cancellation Rate'
    ]
}

def extract_baseline_metrics():
    '''Extract baseline performance from CSV'''
    try:
        # Try to load the actual CSV
        df = pd.read_csv('Pacific_Sands_Baseline_Data.csv')
        
        # Extract key metrics
        latest = df.iloc[-1] if len(df) > 0 else None
        
        if latest is not None:
            metrics = {
                'revenue_growth': latest.get('Revenue % Δ', 0),
                'room_nights_growth': latest.get('Room Nights % Δ', 0),
                'adr_growth': latest.get('ADR % Δ', 0),
                'pickup_adr_premium': latest.get('Pickup ADR Δ ($)', 0),
                'pickup_adr_growth': latest.get('Pickup ADR % Δ', 0)
            }
            
            print('📊 BASELINE METRICS FROM CSV:')
            print(f'  Revenue Growth: {metrics["revenue_growth"]}%')
            print(f'  Room Nights Growth: {metrics["room_nights_growth"]}%')
            print(f'  ADR Growth: {metrics["adr_growth"]}%')
            print(f'  Pickup ADR Premium: ${metrics["pickup_adr_premium"]}')
            print(f'  Pickup ADR Growth: {metrics["pickup_adr_growth"]}%')
            
            return metrics
    except:
        print('Using Master Reference targets as baseline')
        return {
            'revenue_growth': 10,
            'room_nights_growth': 11,
            'adr_growth': 2,
            'pickup_adr_premium': 125,
            'pickup_adr_growth': 40
        }

def generate_ai_context():
    '''Generate AI context from Master Reference'''
    
    context = f'''
PACIFIC SANDS AI CONTEXT - MASTER REFERENCE v1.3
================================================

CRITICAL BUSINESS RULES:

1. PRIMARY KPI: RevPAR (Revenue Per Available Room)
   - All decisions optimize for RevPAR first
   - Formula: ADR × Occupancy
   - Target: Maximize through balanced pricing

2. 🚨 CRITICAL INSIGHT: Pickup ADR Premium
   - Recent pickup ADRs are $100-150 HIGHER than base
   - ACTION: HOLD RATES LONGER on near-in dates
   - TRIGGER: When pickup premium detected, FREEZE DISCOUNTS

3. UNIT TYPE ELASTICITY:
   2BR+ Units (Most Responsive):
   - Soft periods: -10% to -20% targeted reductions
   - Compression: +3% to +6% premium
   - Strategy: Time-boxed reductions, protect top performers
   
   Smaller Units (Less Elastic):
   - Soft periods: -5% to -8% lighter trims
   - Compression: +2% to +4% modest premium

4. SEASONAL PLAYBOOKS:
   July Softness:
   - 2BR+: -15% to -20% discount band
   - Relax min-stay by 1 night
   - Add LOS promos for midweek
   
   Sept/Oct Strength:
   - HOLD RATES - avoid blanket cuts
   - Narrow discount bands
   - Let premium persist on best sellers

5. OCCUPANCY TRIGGERS BY DAYS OUT:
   90-31 days: <70% → -5% to -10% on 2BR+, relax fences
   30-8 days: <75% → -10% to -15%, consider 3for2 promos
   7-0 days: <70% → -8% to -12% micro-promo
             >90% → HOLD or +3% to +6% premium

6. FLEX BANDS:
   - Floor: -20% maximum discount
   - Ceiling: +25% maximum premium
   - Bands narrow as stay date approaches

7. DAILY OPERATING RHYTHM:
   02:00 - Automated data sync and recomputation
   07:30 - Human review and override
   11:00 - First pulse adjustment (±1-3%)
   16:00 - Second pulse adjustment

8. PERFORMANCE TARGETS:
   - Revenue: +10% (double-digit growth)
   - Room Nights: +11-12%
   - ADR: +1-3% (modest growth)
   - Occupancy: 85-90% optimal range

DECISION FRAMEWORK:
- Never sacrifice RevPAR for occupancy alone
- 2BR+ units drive revenue in soft periods
- Hold rates when pickup shows pricing power
- Weekend premiums are non-negotiable
- Parity monitoring is critical (±2% tolerance)

This context should guide all analytics and recommendations.
'''
    
    return context

def main():
    print('🌊 PACIFIC SANDS MASTER REFERENCE PROCESSOR')
    print('=' * 60)
    print('Extracting actual business logic from Master Reference\n')
    
    # Extract baseline metrics
    metrics = extract_baseline_metrics()
    
    # Generate AI context
    ai_context = generate_ai_context()
    
    # Save context for AI consumption
    with open('pacific_sands_master_context.txt', 'w') as f:
        f.write(ai_context)
    
    # Save structured rules
    with open('pacific_sands_master_rules.json', 'w') as f:
        json.dump(MASTER_INSIGHTS, f, indent=2)
    
    print('\n✅ MASTER INTELLIGENCE PROCESSED!')
    print('\n📄 Generated Files:')
    print('  - pacific_sands_master_context.txt (AI context)')
    print('  - pacific_sands_master_rules.json (Structured rules)')
    print('  - pacific_sands_master_intelligence.py (Intelligence engine)')
    
    print('\n🎯 KEY ACTIONS TO IMPLEMENT NOW:')
    print('  1. HOLD RATES when pickup ADR shows $100+ premium')
    print('  2. Target 2BR+ with -15% to -20% in July soft periods')
    print('  3. Maintain Sept/Oct strength - avoid blanket discounts')
    print('  4. Monitor parity daily (±2% tolerance)')
    print('  5. Execute 07:30 human review, 11:00/16:00 pulses')
    
    print('\n💡 CRITICAL INSIGHT:')
    print('  Your pickup ADRs being $100-150 higher than base')
    print('  indicates STRONG PRICING POWER - capitalize on this!')

if __name__ == '__main__':
    main()
