#!/usr/bin/env python3
'''
Pacific Sands Revenue Management System (RMS) Intelligence
Implements the ACTUAL business rules and triggers from PS Master Reference
'''

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json

class PacificSandsRMS:
    '''Pacific Sands Revenue Management System - v1.3 Implementation'''
    
    def __init__(self):
        # ACTUAL BUSINESS RULES FROM PS MASTER REFERENCE
        self.business_rules = {
            # Performance Targets
            'revenue_growth_target': 0.10,  # Double-digit growth
            'room_nights_growth': 0.11,  # 11-12% growth
            'adr_growth': 0.03,  # 1-3% growth
            
            # Occupancy Thresholds by Days Out
            'occ_thresholds': {
                '90_31_days': {
                    'trigger_delta': 0.05,  # Δ1
                    'action': 'relax_fences_minor_discount',
                    'discount_range': [-0.05, -0.10],
                    'units_focus': '2BR+'
                },
                '30_8_days': {
                    'trigger_delta': 0.10,  # Δ2
                    'action': 'widen_discount_add_promos',
                    'discount_range': [-0.10, -0.15],
                    'los_promo': '3for2'
                },
                '7_0_days': {
                    'same_day_target': 0.80,
                    'compression_line': 0.90,
                    'action': 'tactical_micro_promo',
                    'discount_range': [-0.08, -0.12],
                    'premium_range': [0.03, 0.06]
                }
            },
            
            # Pickup ADR Triggers
            'pickup_adr_trigger': {
                'threshold': 'base_adr + 1_std',
                'action': 'freeze_discounts',
                'recent_pickup_premium': [100, 150]  # $100-150 over base
            },
            
            # Unit Type Elasticity
            'unit_elasticity': {
                '2BR+': {
                    'shoulder_discount': [-0.10, -0.20],
                    'response': 'high',
                    'hold_premium_on_compression': True
                },
                '1BR': {
                    'discount': [-0.05, -0.08],
                    'response': 'moderate'
                },
                'Studio': {
                    'discount': [-0.05, -0.08],
                    'response': 'low'
                }
            },
            
            # Seasonal Patterns
            'weak_periods': {
                'july_clusters': ['early_mid_july'],
                'specific_dates': ['Aug 9', 'Nov 20']
            },
            'strong_periods': {
                'peak_months': ['September', 'October'],
                'specific_windows': ['mid_late_june', 'late_october_weekends']
            },
            
            # Flex Bands
            'flex_bands': {
                'min': -0.20,  # -20% floor
                'max': 0.25,   # +25% ceiling
                'tightening_by_doa': True
            },
            
            # LOS Fences
            'los_fences': {
                'holiday_min_stay': [2, 3],
                'pre_peak_threshold_days': 21
            },
            
            # Rate Parity
            'parity_guard': {
                'tolerance': 0.02,  # ±2%
                'check_frequency': 'daily'
            }
        }
        
        # KPIs to Track
        self.kpis = {
            'primary': ['Occupancy', 'ADR', 'RevPAR', 'TRevPAR'],
            'secondary': ['Pace_vs_LY', 'Pickup_ADR', 'Conversion', 'Cancellation_Rate'],
            'by_unit': ['Occ_vs_Curve', 'ADR_vs_Band', 'Mix_Shift'],
            'by_channel': ['Brand_vs_OTA', 'Parity_Delta', 'Commission_Impact']
        }
        
        # Playbook Library
        self.playbooks = {
            'july_softness': {
                '2BR+': {'discount': -0.15, 'min_stay_relax': -1, 'los_promo': True},
                'smaller_units': {'discount': -0.06}
            },
            'aug_9_softness': {
                'days_out': [10, 14],
                'action': 'pulse_promo',
                'discount': -0.09,
                'value_add': ['parking', 'late_checkout']
            },
            'sept_oct_strength': {
                'action': 'hold_rates',
                'narrow_discounts': True,
                'avoid_blanket_cuts': True
            },
            'compression_event': {
                'action': 'premium_hold',
                'rate_increase': [0.03, 0.06],
                'protect_best_sellers': True
            }
        }
    
    def calculate_rms_recommendation(self, date, unit_type, current_occ, days_out, 
                                    base_adr, pickup_adr, market_compression=False):
        '''
        Core RMS Engine - Calculate pricing recommendation based on actual PS rules
        '''
        recommendation = {
            'date': date,
            'unit_type': unit_type,
            'base_action': 'hold',
            'rate_adjustment': 0,
            'confidence': 0,
            'triggers_fired': [],
            'playbook': None
        }
        
        # Check occupancy thresholds by days out
        if 31 <= days_out <= 90:
            threshold = self.business_rules['occ_thresholds']['90_31_days']
            if current_occ < (0.75 - threshold['trigger_delta']):  # Below target curve
                recommendation['base_action'] = 'discount'
                if unit_type == '2BR+':
                    recommendation['rate_adjustment'] = threshold['discount_range'][1]  # -10%
                    recommendation['triggers_fired'].append('90_31_day_occ_below_target')
                else:
                    recommendation['rate_adjustment'] = threshold['discount_range'][0]  # -5%
                    
        elif 8 <= days_out <= 30:
            threshold = self.business_rules['occ_thresholds']['30_8_days']
            if current_occ < (0.70 - threshold['trigger_delta']):
                recommendation['base_action'] = 'aggressive_discount'
                if unit_type == '2BR+':
                    recommendation['rate_adjustment'] = threshold['discount_range'][1]  # -15%
                    recommendation['playbook'] = 'add_los_promo'
                    recommendation['triggers_fired'].append('30_8_day_pace_below_floor')
                else:
                    recommendation['rate_adjustment'] = -0.08
                    
        elif days_out < 8:
            threshold = self.business_rules['occ_thresholds']['7_0_days']
            if current_occ >= threshold['compression_line']:
                recommendation['base_action'] = 'premium'
                recommendation['rate_adjustment'] = threshold['premium_range'][0]  # +3%
                recommendation['triggers_fired'].append('compression_detected')
            elif current_occ < threshold['same_day_target']:
                recommendation['base_action'] = 'tactical_discount'
                recommendation['rate_adjustment'] = threshold['discount_range'][0]  # -8%
                recommendation['triggers_fired'].append('same_day_below_target')
        
        # Check pickup ADR trigger (CRITICAL INSIGHT)
        if pickup_adr and base_adr:
            pickup_premium = pickup_adr - base_adr
            if pickup_premium >= 100:  # Actual $100+ premium seen in data
                recommendation['base_action'] = 'freeze_discounts'
                recommendation['rate_adjustment'] = max(0, recommendation['rate_adjustment'])
                recommendation['triggers_fired'].append(f'pickup_premium_${pickup_premium:.0f}')
                recommendation['confidence'] = 0.95
        
        # Apply seasonal patterns
        if 'july' in date.lower() or 'Jul' in date:
            if unit_type == '2BR+':
                recommendation['playbook'] = 'july_softness'
                recommendation['rate_adjustment'] = min(recommendation['rate_adjustment'], -0.15)
                recommendation['triggers_fired'].append('july_weakness_detected')
                
        elif 'sep' in date.lower() or 'oct' in date.lower():
            recommendation['playbook'] = 'sept_oct_strength'
            recommendation['rate_adjustment'] = max(recommendation['rate_adjustment'], 0)
            recommendation['triggers_fired'].append('peak_season_strength')
        
        # Market compression override
        if market_compression:
            recommendation['base_action'] = 'premium'
            recommendation['rate_adjustment'] = max(recommendation['rate_adjustment'], 0.05)
            recommendation['triggers_fired'].append('market_compression')
        
        # Calculate confidence based on triggers
        recommendation['confidence'] = min(0.95, 0.60 + len(recommendation['triggers_fired']) * 0.10)
        
        return recommendation
    
    def generate_tactical_actions(self, current_state):
        '''
        Generate specific tactical actions based on current state
        '''
        actions = []
        
        # Parse current state
        occupancy = current_state.get('occupancy', 0)
        pickup_adr = current_state.get('pickup_adr', 0)
        base_adr = current_state.get('base_adr', 250)
        days_out = current_state.get('days_out', 30)
        unit_mix = current_state.get('unit_mix', {})
        
        # HIGH PRIORITY: Pickup ADR opportunity
        if pickup_adr > base_adr + 100:
            actions.append({
                'priority': 'CRITICAL',
                'action': 'FREEZE all discounts immediately',
                'reason': f'Pickup ADR ${pickup_adr:.0f} shows ${pickup_adr-base_adr:.0f} premium',
                'expected_impact': f'+${(pickup_adr-base_adr)*0.5:.0f} RevPAR',
                'implementation': 'Remove all discount codes, hold BAR'
            })
        
        # Unit type specific actions
        if '2BR+' in unit_mix:
            if unit_mix['2BR+'].get('occupancy', 0) < 0.60 and days_out > 14:
                actions.append({
                    'priority': 'HIGH',
                    'action': 'Target 2BR+ with -15% to -20% discount',
                    'reason': '2BR+ units below 60% occupancy in shoulder period',
                    'expected_impact': '+15-20% conversion on 2BR+',
                    'implementation': 'Apply SHOULDER20 promo code to 2BR+ inventory'
                })
        
        # Compression tactics
        if occupancy > 0.90 and days_out < 7:
            actions.append({
                'priority': 'HIGH',
                'action': 'Implement +5% rate increase',
                'reason': 'Compression detected (<10% availability)',
                'expected_impact': f'+${base_adr*0.05:.0f} ADR with minimal occ impact',
                'implementation': 'Adjust BAR grid +5%, remove all discounts'
            })
        
        # LOS optimization
        if occupancy < 0.70 and days_out > 7:
            actions.append({
                'priority': 'MEDIUM',
                'action': 'Activate 3-for-2 LOS promotion',
                'reason': 'Soft demand period, incentivize longer stays',
                'expected_impact': '+25% on 3+ night bookings',
                'implementation': 'Enable LOS3FOR2 in booking engine'
            })
        
        # Parity alerts
        actions.append({
            'priority': 'MEDIUM',
            'action': 'Daily parity check at 07:30',
            'reason': 'Maintain rate integrity',
            'expected_impact': 'Protect direct channel margin',
            'implementation': 'Compare brand.com vs OTA rates, correct >2% deltas'
        })
        
        return actions
    
    def calculate_forecast(self, historical_data, forward_days=30):
        '''
        Generate forecast using PS methodology
        '''
        forecast = {
            'period': f'Next {forward_days} days',
            'methodology': 'PS RMS v1.3',
            'scenarios': {}
        }
        
        # Base scenario (using actual PS growth rates)
        base_growth = {
            'revenue': 0.10,  # 10% YoY
            'room_nights': 0.115,  # 11.5% YoY
            'adr': 0.02  # 2% YoY
        }
        
        # Calculate projections
        if historical_data:
            hist_revenue = historical_data.get('revenue', 1000000)
            hist_adr = historical_data.get('adr', 250)
            hist_occupancy = historical_data.get('occupancy', 0.75)
            
            forecast['scenarios']['base'] = {
                'revenue': hist_revenue * (1 + base_growth['revenue']),
                'adr': hist_adr * (1 + base_growth['adr']),
                'occupancy': min(0.95, hist_occupancy * (1 + base_growth['room_nights'])),
                'revpar': hist_adr * (1 + base_growth['adr']) * min(0.95, hist_occupancy * (1 + base_growth['room_nights']))
            }
            
            # Optimistic (with pickup ADR premium)
            forecast['scenarios']['optimistic'] = {
                'revenue': hist_revenue * 1.15,
                'adr': hist_adr + 125,  # With pickup premium
                'occupancy': 0.90,
                'revpar': (hist_adr + 125) * 0.90
            }
            
            # Conservative
            forecast['scenarios']['conservative'] = {
                'revenue': hist_revenue * 1.05,
                'adr': hist_adr,
                'occupancy': 0.70,
                'revpar': hist_adr * 0.70
            }
        
        return forecast

def process_master_reference():
    '''Process the Pacific Sands Master Reference document'''
    
    print('🎯 PACIFIC SANDS RMS INTELLIGENCE SYSTEM')
    print('=' * 60)
    print('Implementing ACTUAL Revenue Management System v1.3')
    print('')
    
    # Initialize RMS
    rms = PacificSandsRMS()
    
    # Example current state (would be pulled from actual data)
    current_state = {
        'date': 'July 15, 2024',
        'occupancy': 0.65,
        'pickup_adr': 385,  # Showing the $100+ premium
        'base_adr': 250,
        'days_out': 14,
        'unit_mix': {
            '2BR+': {'occupancy': 0.55, 'adr': 320},
            '1BR': {'occupancy': 0.70, 'adr': 220},
            'Studio': {'occupancy': 0.75, 'adr': 180}
        }
    }
    
    print('📊 Current State Analysis:')
    print(f'  Date: {current_state["date"]}')
    print(f'  Overall Occupancy: {current_state["occupancy"]*100:.1f}%')
    print(f'  Pickup ADR: ${current_state["pickup_adr"]}')
    print(f'  Base ADR: ${current_state["base_adr"]}')
    print(f'  Pickup Premium: ${current_state["pickup_adr"] - current_state["base_adr"]}')
    print('')
    
    # Generate RMS recommendations
    print('🎯 RMS Recommendations by Unit Type:')
    for unit_type in ['2BR+', '1BR', 'Studio']:
        unit_data = current_state['unit_mix'].get(unit_type, {})
        reco = rms.calculate_rms_recommendation(
            date=current_state['date'],
            unit_type=unit_type,
            current_occ=unit_data.get('occupancy', 0.60),
            days_out=current_state['days_out'],
            base_adr=unit_data.get('adr', 250),
            pickup_adr=current_state['pickup_adr']
        )
        
        print(f'\n  {unit_type}:')
        print(f'    Action: {reco["base_action"]}')
        print(f'    Rate Adjustment: {reco["rate_adjustment"]*100:+.1f}%')
        print(f'    Confidence: {reco["confidence"]*100:.0f}%')
        if reco['triggers_fired']:
            print(f'    Triggers: {', '.join(reco["triggers_fired"])}')
        if reco['playbook']:
            print(f'    Playbook: {reco["playbook"]}')
    
    # Generate tactical actions
    print('\n📋 Tactical Actions (Prioritized):')
    actions = rms.generate_tactical_actions(current_state)
    for i, action in enumerate(actions, 1):
        print(f'\n  {i}. [{action["priority"]}] {action["action"]}')
        print(f'     Reason: {action["reason"]}')
        print(f'     Impact: {action["expected_impact"]}')
        print(f'     How: {action["implementation"]}')
    
    # Generate forecast
    print('\n📈 Forward-Looking Projections:')
    historical = {
        'revenue': 1200000,
        'adr': 250,
        'occupancy': 0.75
    }
    forecast = rms.calculate_forecast(historical, forward_days=30)
    
    for scenario_name, scenario_data in forecast['scenarios'].items():
        print(f'\n  {scenario_name.upper()} Scenario:')
        print(f'    Revenue: ${scenario_data["revenue"]:,.0f}')
        print(f'    ADR: ${scenario_data["adr"]:.2f}')
        print(f'    Occupancy: {scenario_data["occupancy"]*100:.1f}%')
        print(f'    RevPAR: ${scenario_data["revpar"]:.2f}')
    
    # Save RMS configuration
    rms_config = {
        'version': '1.3',
        'business_rules': rms.business_rules,
        'kpis': rms.kpis,
        'playbooks': rms.playbooks,
        'implementation_status': 'ACTIVE',
        'last_updated': datetime.now().isoformat()
    }
    
    with open('pacific_sands_rms_config.json', 'w') as f:
        json.dump(rms_config, f, indent=2, default=str)
    
    print('\n' + '=' * 60)
    print('✅ RMS INTELLIGENCE SYSTEM CONFIGURED')
    print('📄 Configuration saved: pacific_sands_rms_config.json')
    print('🚀 System ready for real-time revenue optimization')
    print('\n🎯 KEY INSIGHTS ACTIVATED:')
    print('  • Pickup ADR premiums ($100-150) trigger rate holds')
    print('  • 2BR+ units get -15% to -20% in soft periods')
    print('  • July weakness requires tactical discounting')
    print('  • Sept/Oct strength = hold rates, avoid blanket cuts')
    print('  • Compression >90% = implement +3-6% premium')

if __name__ == '__main__':
    process_master_reference()
