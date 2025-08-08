#!/usr/bin/env python3
'''
Pacific Sands Resort - CSV Upload Preview
Shows what files will be uploaded and their detected data types
'''

import os
import csv
from pathlib import Path

LOCAL_DATA_PATH = os.path.expanduser('~/Downloads/PacificSands_AllCSV/')

def detect_data_type(filename):
    """Auto-detect data type from filename"""
    name = filename.lower()
    
    if 'rate' in name or 'pricing' in name or 'adr' in name:
        return 'rates'
    elif 'booking' in name or 'reservation' in name or 'res_' in name:
        return 'bookings'  
    elif 'review' in name or 'feedback' in name or 'satisfaction' in name:
        return 'reviews'
    elif 'competitor' in name or 'comp_' in name or 'market' in name:
        return 'competitors'
    elif 'occupancy' in name or 'occ_' in name or 'revpar' in name:
        return 'occupancy'
    elif 'revenue' in name or 'rev_' in name:
        return 'revenue'
    elif 'guest' in name or 'customer' in name:
        return 'customer_data'
    elif 'channel' in name or 'source' in name:
        return 'channel_data'
    else:
        return 'rates'  # Default

def get_csv_info(filepath):
    """Get basic info about a CSV file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            headers = next(reader, [])
            row_count = sum(1 for row in reader)
        return len(headers), row_count
    except:
        return 0, 0

def main():
    print('🏨 Pacific Sands Analytics - CSV Upload Preview')
    print('=' * 60)
    print(f'📂 Scanning: {LOCAL_DATA_PATH}')
    print('')
    
    # Collect all CSV files
    csv_files = []
    for root, dirs, files in os.walk(LOCAL_DATA_PATH):
        for file in files:
            if file.endswith('.csv'):
                filepath = os.path.join(root, file)
                csv_files.append(filepath)
    
    if not csv_files:
        print('❌ No CSV files found!')
        return
    
    print(f'📊 Found {len(csv_files)} CSV files')
    print('')
    
    # Analyze files by data type
    data_types = {}
    total_records = 0
    
    print('📋 File Analysis:')
    print('-' * 80)
    print(f'{"Filename":<40} {"Type":<15} {"Columns":<8} {"Rows":<8}')
    print('-' * 80)
    
    for filepath in sorted(csv_files):
        filename = os.path.basename(filepath)
        data_type = detect_data_type(filename)
        cols, rows = get_csv_info(filepath)
        
        # Track by data type
        if data_type not in data_types:
            data_types[data_type] = {'files': 0, 'records': 0}
        data_types[data_type]['files'] += 1
        data_types[data_type]['records'] += rows
        total_records += rows
        
        # Print file info (truncate long filenames)
        display_name = filename[:39] + '...' if len(filename) > 40 else filename
        print(f'{display_name:<40} {data_type:<15} {cols:<8} {rows:<8}')
    
    print('-' * 80)
    print('')
    
    # Summary by data type
    print('📊 Summary by Data Type:')
    print('-' * 40)
    for dtype, stats in sorted(data_types.items()):
        print(f'{dtype:<20} {stats["files"]:>3} files  {stats["records"]:>8,} records')
    
    print('-' * 40)
    print(f'{"TOTAL":<20} {len(csv_files):>3} files  {total_records:>8,} records')
    print('')
    
    # Upload readiness check
    print('✅ Upload Readiness:')
    print(f'   • {len(csv_files)} CSV files detected')
    print(f'   • {total_records:,} total records ready')
    print(f'   • {len(data_types)} different data types')
    print(f'   • Auto-detection configured')
    print('')
    
    print('🚀 Ready for bulk upload!')
    print('   Run upload_to_mcp.py after deploying your API server')

if __name__ == '__main__':
    main()