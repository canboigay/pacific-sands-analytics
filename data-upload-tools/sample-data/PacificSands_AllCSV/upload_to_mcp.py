#!/usr/bin/env python3
'''
Pacific Sands Resort - MCP Server Upload Script
This script uploads all CSV files for indexing and vectorization
'''

import os
import json
import hashlib
import csv
import requests
import time
from datetime import datetime
from pathlib import Path

# Configuration - UPDATE THESE AFTER DEPLOYMENT
MCP_SERVER_URL = 'https://pacific-sands-analytics.vercel.app'  # Your deployed URL
MCP_API_KEY = 'ps_me2w0k3e_x81fsv0yz3k'  # Your API key

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

def read_csv_file(filepath):
    """Read and parse CSV file"""
    try:
        data = []
        with open(filepath, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                data.append(dict(row))
        return data
    except Exception as e:
        print(f"   ❌ Error reading {filepath}: {e}")
        return None

def upload_file_to_mcp(filepath, data_type, data):
    """Upload single file to MCP server"""
    filename = os.path.basename(filepath)
    
    payload = {
        'data_type': data_type,
        'data': data,
        'source': 'bulk_csv_upload',
        'filename': filename,
        'uploaded_at': datetime.now().isoformat()
    }
    
    headers = {
        'Authorization': f'Bearer {MCP_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            f'{MCP_SERVER_URL}/api/data/upload',
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return True, result.get('records_processed', 0)
        else:
            return False, f"HTTP {response.status_code}: {response.text}"
            
    except requests.exceptions.RequestException as e:
        return False, str(e)

def main():
    print('🏨 Pacific Sands Analytics - Bulk CSV Upload')
    print('=' * 60)
    print(f'📂 Data location: {LOCAL_DATA_PATH}')
    print(f'🌐 Target server: {MCP_SERVER_URL}')
    print('')
    
    # Validate configuration
    if MCP_SERVER_URL == 'http://localhost:3000':
        print('⚠️  WARNING: Using localhost URL')
        print('   Update MCP_SERVER_URL after deploying to live server')
        print('')
    
    # Count and collect all CSV files
    csv_files = []
    for root, dirs, files in os.walk(LOCAL_DATA_PATH):
        for file in files:
            if file.endswith('.csv'):
                filepath = os.path.join(root, file)
                csv_files.append(filepath)
    
    total_files = len(csv_files)
    print(f'📊 Found {total_files} CSV files ready for upload')
    
    if total_files == 0:
        print('No CSV files found. Exiting.')
        return
    
    print('')
    confirm = input('🚀 Ready to start bulk upload? (y/N): ')
    if confirm.lower() != 'y':
        print('Upload cancelled.')
        return
    
    print('')
    print('📤 Starting bulk upload...')
    print('')
    
    # Track results
    successful_uploads = 0
    failed_uploads = 0
    total_records = 0
    upload_results = []
    
    # Process files in batches
    batch_size = 5
    for i in range(0, total_files, batch_size):
        batch_files = csv_files[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total_files + batch_size - 1) // batch_size
        
        print(f'📦 Processing batch {batch_num}/{total_batches}')
        
        for filepath in batch_files:
            filename = os.path.basename(filepath)
            data_type = detect_data_type(filename)
            
            print(f'   📁 {filename} → {data_type}')
            
            # Read CSV data
            data = read_csv_file(filepath)
            if data is None:
                failed_uploads += 1
                continue
            
            # Upload to MCP
            success, result = upload_file_to_mcp(filepath, data_type, data)
            
            if success:
                print(f'      ✅ Success: {result} records uploaded')
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
        
        # Progress update
        completed = successful_uploads + failed_uploads
        progress = (completed / total_files) * 100
        print(f'   📈 Progress: {completed}/{total_files} files ({progress:.1f}%)')
        
        # Delay between batches
        if i + batch_size < total_files:
            print('   ⏳ Waiting 2 seconds...')
            time.sleep(2)
        
        print('')
    
    # Final summary
    print('=' * 60)
    print('📊 UPLOAD SUMMARY')
    print('=' * 60)
    print(f'Total files processed: {total_files}')
    print(f'✅ Successful uploads: {successful_uploads}')
    print(f'❌ Failed uploads: {failed_uploads}')
    print(f'📈 Success rate: {(successful_uploads/total_files*100):.1f}%')
    print(f'📊 Total records uploaded: {total_records:,}')
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
    
    print('📋 Data uploaded by type:')
    for dtype, stats in data_types.items():
        print(f'   {dtype}: {stats["files"]} files, {stats["records"]:,} records')
    
    print('')
    print('🎉 Bulk upload complete!')
    print('')
    print('Your data is now available via:')
    print('• Pacific Sands Analytics API')
    print('• Custom GPT integration') 
    print('• Business intelligence dashboard')

if __name__ == '__main__':
    main()

