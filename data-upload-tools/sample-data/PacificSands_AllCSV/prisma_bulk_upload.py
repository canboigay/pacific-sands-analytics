#!/usr/bin/env python3
'''
Pacific Sands Resort - Direct Prisma Database Upload Script
Uploads all 140 CSV files directly to Prisma PostgreSQL database
'''

import os
import json
import csv
import requests
import time
from datetime import datetime
from pathlib import Path

# Configuration - your deployed Pacific Sands Analytics API  
PRISMA_APP_URL = 'https://data-upload-tools-fv3k1av15-pacific-sands.vercel.app'
API_KEY = 'ps_me2w0k3e_x81fsv0yz3k'
LOCAL_DATA_PATH = '/Users/simeong/Downloads/PacificSands_AllCSV'

def detect_data_type(filename):
    """Auto-detect data type from filename"""
    name = filename.lower()
    
    if 'rate' in name or 'pricing' in name or 'adr' in name or 'pace' in name:
        return 'rates'
    elif 'occupancy' in name or 'occ_' in name or 'revpar' in name:
        return 'occupancy'  
    elif 'booking' in name or 'reservation' in name or 'res_' in name:
        return 'bookings'
    elif 'review' in name or 'feedback' in name or 'satisfaction' in name:
        return 'reviews'
    elif 'competitor' in name or 'comp_' in name or 'market' in name:
        return 'competitors'
    else:
        return 'rates'  # Default to rates

def clean_csv_data(data):
    """Clean and normalize CSV data"""
    cleaned_data = []
    
    for row in data:
        clean_row = {}
        for key, value in row.items():
            # Clean column names - remove extra spaces, standardize
            clean_key = key.strip() if key else ''
            
            # Map common column variations
            if clean_key.lower() in ['date', 'stay date', 'arrival date', 'check in', 'checkin']:
                clean_key = 'date'
            elif clean_key.lower() in ['rate', 'adr', 'daily rate', 'room rate', 'average daily rate']:
                clean_key = 'rate'
            elif clean_key.lower() in ['room type', 'roomtype', 'room_type', 'accommodation']:
                clean_key = 'room_type'
            elif clean_key.lower() in ['occupancy', 'occupancy rate', 'occ rate', 'occupancy_rate']:
                clean_key = 'occupancy_rate'
            elif clean_key.lower() in ['channel', 'source', 'booking source', 'reservation source']:
                clean_key = 'channel'
            
            # Clean values
            clean_value = str(value).strip() if value else ''
            
            # Convert numeric fields
            if clean_key in ['rate', 'occupancy_rate'] and clean_value:
                try:
                    # Remove currency symbols and convert to float
                    clean_value = clean_value.replace('$', '').replace(',', '').replace('%', '')
                    clean_value = float(clean_value)
                except:
                    clean_value = 0.0
            elif clean_key in ['rooms_sold', 'rooms_available'] and clean_value:
                try:
                    clean_value = int(float(clean_value))
                except:
                    clean_value = 0
            
            clean_row[clean_key] = clean_value
        
        cleaned_data.append(clean_row)
    
    return cleaned_data

def read_csv_file(filepath):
    """Read and parse CSV file"""
    try:
        data = []
        with open(filepath, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                data.append(row)
        
        # Clean the data
        cleaned_data = clean_csv_data(data)
        return cleaned_data
        
    except Exception as e:
        print(f"   ❌ Error reading {filepath}: {e}")
        return None

def upload_to_prisma(filepath, data_type, data):
    """Upload data to Prisma database via API"""
    filename = os.path.basename(filepath)
    
    payload = {
        'action': 'upload_data',
        'data_type': data_type,
        'data': data,
        'source': 'bulk_csv_upload',
        'filename': filename,
        'uploaded_at': datetime.now().isoformat()
    }
    
    headers = {
        'Authorization': f'Bearer {API_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Try the API endpoint
        response = requests.post(
            f'{PRISMA_APP_URL}/api/upload',
            json=payload,
            headers=headers,
            timeout=120  # Longer timeout for Prisma operations
        )
        
        if response.status_code == 200:
            result = response.json()
            return True, result.get('records_processed', len(data))
        else:
            return False, f"HTTP {response.status_code}: {response.text[:200]}"
            
    except requests.exceptions.RequestException as e:
        return False, str(e)[:200]

def main():
    print('🏨 Pacific Sands Analytics - Prisma Database Upload')
    print('=' * 70)
    print(f'📂 Data location: {LOCAL_DATA_PATH}')
    print(f'🌐 Prisma app: {PRISMA_APP_URL}')
    print('')
    
    # Collect all CSV files
    csv_files = []
    for root, dirs, files in os.walk(LOCAL_DATA_PATH):
        for file in files:
            if file.endswith('.csv') and not file.startswith('.'):
                filepath = os.path.join(root, file)
                csv_files.append(filepath)
    
    total_files = len(csv_files)
    print(f'📊 Found {total_files} CSV files for Prisma upload')
    print('')
    
    if total_files == 0:
        print('❌ No CSV files found. Exiting.')
        return
    
    print('🚀 Starting Prisma database upload...')
    print('')
    
    # Track results
    successful_uploads = 0
    failed_uploads = 0
    total_records = 0
    upload_results = []
    
    # Process files one by one (Prisma can handle this)
    for i, filepath in enumerate(csv_files, 1):
        filename = os.path.basename(filepath)
        data_type = detect_data_type(filename)
        
        print(f'📁 [{i:3d}/{total_files}] {filename[:45]:<45} → {data_type}')
        
        # Read CSV data
        data = read_csv_file(filepath)
        if data is None or len(data) == 0:
            print(f'      ⚠️  Skipped: No valid data')
            failed_uploads += 1
            continue
        
        # Upload to Prisma
        success, result = upload_to_prisma(filepath, data_type, data)
        
        if success:
            print(f'      ✅ Success: {result} records → Prisma DB')
            successful_uploads += 1
            total_records += result
        else:
            print(f'      ❌ Failed: {result}')
            failed_uploads += 1
        
        upload_results.append({
            'filename': filename,
            'success': success,
            'records': result if success else 0,
            'data_type': data_type
        })
        
        # Brief pause between uploads
        if i < total_files:
            time.sleep(0.5)
    
    # Final summary
    print('')
    print('=' * 70)
    print('🎉 PRISMA UPLOAD COMPLETE!')
    print('=' * 70)
    print(f'Total files processed: {total_files}')
    print(f'✅ Successful uploads: {successful_uploads}')
    print(f'❌ Failed uploads: {failed_uploads}')
    print(f'📈 Success rate: {(successful_uploads/total_files*100):.1f}%')
    print(f'📊 Total records in Prisma: {total_records:,}')
    print('')
    
    # Group by data type
    data_types = {}
    for result in upload_results:
        if result['success']:
            dt = result['data_type']
            if dt not in data_types:
                data_types[dt] = {'files': 0, 'records': 0}
            data_types[dt]['files'] += 1
            data_types[dt]['records'] += result['records']
    
    print('📋 Data stored in Prisma by type:')
    for dtype, stats in data_types.items():
        print(f'   {dtype:<15} {stats["files"]:>3} files  {stats["records"]:>8,} records')
    
    print('')
    print('🎉 Your Pacific Sands data is now in Prisma PostgreSQL!')
    print('')
    print('✅ Available for:')
    print('   • Real-time analytics queries')
    print('   • Custom GPT integration') 
    print('   • Business intelligence dashboards')
    print('   • Advanced reporting and forecasting')
    print('')
    
    if failed_uploads > 0:
        print('⚠️  Failed uploads:')
        for result in upload_results:
            if not result['success']:
                print(f'   • {result["filename"]}')

if __name__ == '__main__':
    main()