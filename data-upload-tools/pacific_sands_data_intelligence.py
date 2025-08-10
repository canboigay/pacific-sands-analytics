#!/usr/bin/env python3
'''
Pacific Sands Data Intelligence System
Classifies, vectorizes, and contextualizes all PS Data
'''

import pandas as pd
import numpy as np
import json
import os
from datetime import datetime
from typing import Dict, List, Any
import hashlib

class PacificSandsDataIntelligence:
    '''Intelligence layer for Pacific Sands data'''
    
    def __init__(self):
        # Business context rules
        self.business_rules = {
            'optimal_occupancy': 0.85,
            'weekend_premium': 1.35,
            'ocean_view_premium': 1.25,
            'suite_premium': 1.60,
            'peak_season_months': [6, 7, 8],
            'shoulder_months': [4, 5, 9, 10],
            'target_revpar_growth': 0.15,
            'min_acceptable_rate': 150,
            'max_acceptable_rate': 600
        }
        
        # KPI thresholds
        self.kpi_thresholds = {
            'occupancy': {
                'critical_low': 0.50,
                'low': 0.60,
                'optimal_min': 0.80,
                'optimal_max': 0.90,
                'high': 0.95
            },
            'rate': {
                'budget': 200,
                'standard': 250,
                'premium': 300,
                'luxury': 400
            },
            'rating': {
                'poor': 3.5,
                'average': 4.0,
                'good': 4.5,
                'excellent': 4.8
            }
        }
        
        # Classification vectors
        self.classifications = {}
        
    def classify_data(self, df: pd.DataFrame, filename: str) -> Dict:
        '''Classify and contextualize data'''
        
        classification = {
            'filename': filename,
            'timestamp': datetime.now().isoformat(),
            'data_type': self._detect_data_type(df, filename),
            'temporal_range': self._get_temporal_range(df),
            'quality_score': self._assess_data_quality(df),
            'business_relevance': self._calculate_relevance(df, filename),
            'key_metrics': self._extract_key_metrics(df),
            'patterns': self._detect_patterns(df),
            'anomalies': self._detect_anomalies(df),
            'vector_embedding': self._create_vector_embedding(df, filename)
        }
        
        return classification
    
    def _detect_data_type(self, df: pd.DataFrame, filename: str) -> str:
        '''Intelligently detect data type with business context'''
        
        columns_lower = [str(col).lower() for col in df.columns]
        filename_lower = filename.lower()
        
        # Scoring system for data type detection
        scores = {
            'revenue_data': 0,
            'occupancy_data': 0,
            'rate_data': 0,
            'competitor_data': 0,
            'customer_data': 0,
            'operational_data': 0
        }
        
        # Filename patterns
        if 'revenue' in filename_lower or 'revpar' in filename_lower:
            scores['revenue_data'] += 5
        if 'rate' in filename_lower or 'adr' in filename_lower or 'pricing' in filename_lower:
            scores['rate_data'] += 5
        if 'occupancy' in filename_lower or 'occ' in filename_lower:
            scores['occupancy_data'] += 5
        if 'competitor' in filename_lower or 'comp' in filename_lower:
            scores['competitor_data'] += 5
        if 'review' in filename_lower or 'feedback' in filename_lower:
            scores['customer_data'] += 5
            
        # Column patterns
        for col in columns_lower:
            if 'revenue' in col or 'revpar' in col:
                scores['revenue_data'] += 2
            if 'rate' in col or 'adr' in col or 'price' in col:
                scores['rate_data'] += 2
            if 'occupancy' in col or 'occ' in col:
                scores['occupancy_data'] += 2
            if 'competitor' in col:
                scores['competitor_data'] += 3
            if 'rating' in col or 'review' in col:
                scores['customer_data'] += 2
                
        # Return highest scoring type
        return max(scores, key=scores.get)
    
    def _get_temporal_range(self, df: pd.DataFrame) -> Dict:
        '''Extract temporal characteristics'''
        
        date_columns = []
        for col in df.columns:
            if 'date' in str(col).lower():
                try:
                    df[col] = pd.to_datetime(df[col])
                    date_columns.append(col)
                except:
                    pass
        
        if date_columns:
            date_col = date_columns[0]
            return {
                'start_date': str(df[date_col].min()),
                'end_date': str(df[date_col].max()),
                'days_covered': (df[date_col].max() - df[date_col].min()).days,
                'data_frequency': self._detect_frequency(df[date_col])
            }
        
        return {'temporal_data': False}
    
    def _detect_frequency(self, date_series) -> str:
        '''Detect data frequency (daily, weekly, monthly)'''
        if len(date_series) < 2:
            return 'unknown'
            
        diff = date_series.diff().median()
        if pd.Timedelta(days=0.5) <= diff <= pd.Timedelta(days=1.5):
            return 'daily'
        elif pd.Timedelta(days=6) <= diff <= pd.Timedelta(days=8):
            return 'weekly'
        elif pd.Timedelta(days=25) <= diff <= pd.Timedelta(days=35):
            return 'monthly'
        else:
            return 'irregular'
    
    def _assess_data_quality(self, df: pd.DataFrame) -> Dict:
        '''Assess data quality and completeness'''
        
        total_cells = df.shape[0] * df.shape[1]
        missing_cells = df.isnull().sum().sum()
        
        quality_score = (total_cells - missing_cells) / total_cells if total_cells > 0 else 0
        
        return {
            'completeness': quality_score,
            'total_records': len(df),
            'total_columns': len(df.columns),
            'missing_data_pct': (missing_cells / total_cells * 100) if total_cells > 0 else 0,
            'quality_rating': 'excellent' if quality_score > 0.95 else 'good' if quality_score > 0.85 else 'fair' if quality_score > 0.70 else 'poor'
        }
    
    def _calculate_relevance(self, df: pd.DataFrame, filename: str) -> Dict:
        '''Calculate business relevance score'''
        
        relevance_score = 0
        factors = []
        
        # Check for key business metrics
        columns_lower = [str(col).lower() for col in df.columns]
        
        # High relevance indicators
        if any('revpar' in col for col in columns_lower):
            relevance_score += 10
            factors.append('Contains RevPAR - Primary KPI')
        
        if any('rate' in col or 'adr' in col for col in columns_lower):
            relevance_score += 8
            factors.append('Contains rate data - Revenue driver')
            
        if any('occupancy' in col for col in columns_lower):
            relevance_score += 8
            factors.append('Contains occupancy - Demand indicator')
            
        if any('competitor' in col for col in columns_lower):
            relevance_score += 6
            factors.append('Contains competitor data - Market intelligence')
            
        # Recency bonus
        if hasattr(df, 'date'):
            try:
                latest_date = pd.to_datetime(df['date']).max()
                days_old = (datetime.now() - latest_date).days
                if days_old < 30:
                    relevance_score += 5
                    factors.append('Recent data - High relevance')
            except:
                pass
        
        return {
            'score': relevance_score,
            'rating': 'critical' if relevance_score >= 15 else 'high' if relevance_score >= 10 else 'medium' if relevance_score >= 5 else 'low',
            'factors': factors
        }
    
    def _extract_key_metrics(self, df: pd.DataFrame) -> Dict:
        '''Extract key business metrics from data'''
        
        metrics = {}
        
        # Try to extract rate metrics
        for col in df.columns:
            col_lower = str(col).lower()
            if 'rate' in col_lower or 'adr' in col_lower:
                try:
                    metrics['avg_rate'] = float(df[col].mean())
                    metrics['max_rate'] = float(df[col].max())
                    metrics['min_rate'] = float(df[col].min())
                    metrics['rate_std'] = float(df[col].std())
                except:
                    pass
                    
            if 'occupancy' in col_lower or 'occ' in col_lower:
                try:
                    occ_val = df[col].mean()
                    if occ_val > 1:  # Percentage
                        occ_val = occ_val / 100
                    metrics['avg_occupancy'] = float(occ_val)
                except:
                    pass
                    
            if 'revenue' in col_lower or 'revpar' in col_lower:
                try:
                    metrics['avg_revenue'] = float(df[col].mean())
                    metrics['total_revenue'] = float(df[col].sum())
                except:
                    pass
        
        # Calculate RevPAR if we have rate and occupancy
        if 'avg_rate' in metrics and 'avg_occupancy' in metrics:
            metrics['calculated_revpar'] = metrics['avg_rate'] * metrics['avg_occupancy']
            
        return metrics
    
    def _detect_patterns(self, df: pd.DataFrame) -> List[str]:
        '''Detect business-relevant patterns'''
        
        patterns = []
        
        # Try to detect day-of-week patterns
        if 'date' in df.columns:
            try:
                df['day_of_week'] = pd.to_datetime(df['date']).dt.dayofweek
                
                # Check for weekend premiums
                if any('rate' in str(col).lower() for col in df.columns):
                    rate_col = [col for col in df.columns if 'rate' in str(col).lower()][0]
                    weekend_avg = df[df['day_of_week'].isin([5, 6])][rate_col].mean()
                    weekday_avg = df[~df['day_of_week'].isin([5, 6])][rate_col].mean()
                    
                    if weekend_avg > weekday_avg * 1.2:
                        patterns.append(f'Strong weekend premium detected: {((weekend_avg/weekday_avg)-1)*100:.1f}%')
                    
                # Check for occupancy patterns
                if any('occupancy' in str(col).lower() for col in df.columns):
                    occ_col = [col for col in df.columns if 'occupancy' in str(col).lower()][0]
                    weekend_occ = df[df['day_of_week'].isin([5, 6])][occ_col].mean()
                    weekday_occ = df[~df['day_of_week'].isin([5, 6])][occ_col].mean()
                    
                    if weekend_occ > weekday_occ * 1.1:
                        patterns.append(f'Weekend occupancy surge: {((weekend_occ/weekday_occ)-1)*100:.1f}%')
                        
            except:
                pass
        
        # Detect seasonality
        if 'date' in df.columns:
            try:
                df['month'] = pd.to_datetime(df['date']).dt.month
                summer_data = df[df['month'].isin([6, 7, 8])]
                
                if len(summer_data) > 0:
                    patterns.append('Contains peak season (summer) data')
            except:
                pass
                
        return patterns
    
    def _detect_anomalies(self, df: pd.DataFrame) -> List[str]:
        '''Detect data anomalies that need attention'''
        
        anomalies = []
        
        # Check for rate anomalies
        for col in df.columns:
            if 'rate' in str(col).lower() or 'adr' in str(col).lower():
                try:
                    rates = pd.to_numeric(df[col], errors='coerce')
                    
                    # Check for unrealistic rates
                    if (rates < self.business_rules['min_acceptable_rate']).any():
                        count = (rates < self.business_rules['min_acceptable_rate']).sum()
                        anomalies.append(f'Found {count} rates below ${self.business_rules["min_acceptable_rate"]}')
                        
                    if (rates > self.business_rules['max_acceptable_rate']).any():
                        count = (rates > self.business_rules['max_acceptable_rate']).sum()
                        anomalies.append(f'Found {count} rates above ${self.business_rules["max_acceptable_rate"]}')
                        
                    # Check for outliers (3 std dev)
                    mean = rates.mean()
                    std = rates.std()
                    outliers = ((rates < mean - 3*std) | (rates > mean + 3*std)).sum()
                    if outliers > 0:
                        anomalies.append(f'Found {outliers} statistical outliers')
                        
                except:
                    pass
                    
        # Check for occupancy anomalies
        for col in df.columns:
            if 'occupancy' in str(col).lower():
                try:
                    occ = pd.to_numeric(df[col], errors='coerce')
                    
                    # Convert to decimal if percentage
                    if occ.mean() > 1:
                        occ = occ / 100
                        
                    if (occ > 1).any():
                        anomalies.append('Occupancy values exceed 100%')
                        
                    if (occ < 0).any():
                        anomalies.append('Negative occupancy values found')
                        
                except:
                    pass
                    
        return anomalies
    
    def _create_vector_embedding(self, df: pd.DataFrame, filename: str) -> List[float]:
        '''Create vector embedding for semantic search'''
        
        # Simple vector based on data characteristics
        vector = []
        
        # Data type encoding
        data_type = self._detect_data_type(df, filename)
        type_vector = [
            1.0 if 'revenue' in data_type else 0.0,
            1.0 if 'rate' in data_type else 0.0,
            1.0 if 'occupancy' in data_type else 0.0,
            1.0 if 'competitor' in data_type else 0.0,
            1.0 if 'customer' in data_type else 0.0
        ]
        vector.extend(type_vector)
        
        # Temporal encoding
        if 'date' in df.columns:
            try:
                dates = pd.to_datetime(df['date'])
                recency = (datetime.now() - dates.max()).days / 365  # Years old
                vector.append(1.0 / (1.0 + recency))  # More recent = higher value
            except:
                vector.append(0.5)
        else:
            vector.append(0.0)
            
        # Quality encoding
        quality = self._assess_data_quality(df)
        vector.append(quality['completeness'])
        
        # Size encoding (log scale)
        vector.append(np.log(len(df) + 1) / 10)
        
        # Business relevance encoding
        relevance = self._calculate_relevance(df, filename)
        vector.append(relevance['score'] / 20)  # Normalize to 0-1
        
        return vector
    
    def generate_ai_context(self, classifications: List[Dict]) -> str:
        '''Generate context summary for AI consumption'''
        
        context = '''
        PACIFIC SANDS DATA CONTEXT SUMMARY
        ===================================
        
        Available Data Sources:
        '''
        
        for cls in classifications:
            context += f'''
        
        File: {cls['filename']}
        Type: {cls['data_type']}
        Relevance: {cls['business_relevance']['rating']}
        Quality: {cls['quality_score']['quality_rating']}
        Records: {cls['quality_score']['total_records']}
        '''
            
            if cls['key_metrics']:
                context += '\n        Key Metrics:'
                for metric, value in cls['key_metrics'].items():
                    context += f'\n          - {metric}: {value:.2f}'
                    
            if cls['patterns']:
                context += '\n        Patterns Detected:'
                for pattern in cls['patterns']:
                    context += f'\n          - {pattern}'
                    
            if cls['anomalies']:
                context += '\n        ⚠️ Anomalies:'
                for anomaly in cls['anomalies']:
                    context += f'\n          - {anomaly}'
        
        context += '''
        
        BUSINESS OBJECTIVES FOR ANALYSIS:
        1. Maximize RevPAR (Primary KPI)
        2. Maintain 85-90% optimal occupancy
        3. Achieve market-leading position
        4. Ensure >4.5 guest satisfaction
        
        KEY INSIGHTS TO EXTRACT:
        - Revenue optimization opportunities
        - Demand patterns and seasonality
        - Competitive positioning gaps
        - Pricing power indicators
        - Operational efficiency metrics
        '''
        
        return context

def process_ps_data_with_intelligence():
    '''Process PS Data folder with full intelligence layer'''
    
    print('🧠 PACIFIC SANDS DATA INTELLIGENCE PROCESSOR')
    print('=' * 60)
    
    intelligence = PacificSandsDataIntelligence()
    ps_data_folder = os.path.expanduser('~/Desktop/PS Data')
    
    # Find all data files
    import glob
    data_files = []
    data_files.extend(glob.glob(os.path.join(ps_data_folder, '**/*.csv'), recursive=True))
    data_files.extend(glob.glob(os.path.join(ps_data_folder, '**/*.xlsx'), recursive=True))
    
    print(f'\nFound {len(data_files)} files to process')
    
    all_classifications = []
    
    for filepath in data_files:
        try:
            print(f'\n📊 Processing: {os.path.basename(filepath)}')
            
            # Read file
            if filepath.endswith('.csv'):
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            
            # Classify and analyze
            classification = intelligence.classify_data(df, os.path.basename(filepath))
            all_classifications.append(classification)
            
            # Print summary
            print(f'  Type: {classification["data_type"]}')
            print(f'  Relevance: {classification["business_relevance"]["rating"]}')
            print(f'  Quality: {classification["quality_score"]["quality_rating"]}')
            
            if classification['patterns']:
                print('  Patterns:')
                for pattern in classification['patterns']:
                    print(f'    - {pattern}')
                    
        except Exception as e:
            print(f'  Error: {e}')
            continue
    
    # Generate AI context
    ai_context = intelligence.generate_ai_context(all_classifications)
    
    # Save intelligence report
    with open('pacific_sands_data_intelligence.json', 'w') as f:
        json.dump(all_classifications, f, indent=2, default=str)
    
    with open('pacific_sands_ai_context.txt', 'w') as f:
        f.write(ai_context)
    
    print('\n' + '=' * 60)
    print('✅ DATA INTELLIGENCE PROCESSING COMPLETE')
    print(f'📊 Processed {len(all_classifications)} data sources')
    print('📄 Intelligence report saved: pacific_sands_data_intelligence.json')
    print('🤖 AI context saved: pacific_sands_ai_context.txt')
    print('\n🎯 Your data is now:')
    print('  - Classified by business relevance')
    print('  - Contextualized with objectives')
    print('  - Vectorized for semantic search')
    print('  - Ready for AI-powered insights')

if __name__ == '__main__':
    process_ps_data_with_intelligence()
