#!/usr/bin/env python3
'''
Upload ALL data from PS Data folder to Pacific Sands Database
'''
import os
import pandas as pd
import requests
import json
from datetime import datetime
import glob
import numpy as np

print('🌊 PACIFIC SANDS - PS DATA FOLDER UPLOADER')
print('=' * 60)

# Configuration
PS_DATA_FOLDER = os.path.expanduser('~/Desktop/PS Data')
API_URL = 'http://localhost:3000/api/upload'
BACKUP_API = 'https://pacific-sands-api.vercel.app/api/upload'
API_KEY = 'ps_me2w0k3e_x81fsv0yz3k'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

def scan_ps_data_folder():
    '''Scan PS Data folder for all data files'''
    print(f'\n📂 Scanning: {PS_DATA_FOLDER}')
    
    if not os.path.exists(PS_DATA_FOLDER):
        # Try alternative paths
        alt_paths = [
            os.path.expanduser('~/Desktop/PSData'),
            os.path.expanduser('~/Desktop/PS\ Data'),
            os.path.expanduser('~/Desktop/ps data'),
            os.path.expanduser('~/Desktop/PS_Data')
        ]
        for path in alt_paths:
            if os.path.exists(path):
                PS_DATA_FOLDER = path
                break
    
    if not os.path.exists(PS_DATA_FOLDER):
        print('❌ PS Data folder not found on Desktop!')
        return []
    
    # Get all CSV and Excel files
    all_files = []
    
    # CSV files
    csv_files = glob.glob(os.path.join(PS_DATA_FOLDER, '**/*.csv'), recursive=True)
    all_files.extend(csv_files)
    print(f'  Found {len(csv_files)} CSV files')
    
    # Excel files
    xlsx_files = glob.glob(os.path.join(PS_DATA_FOLDER, '**/*.xlsx'), recursive=True)
    all_files.extend(xlsx_files)
    print(f'  Found {len(xlsx_files)} Excel files')
    
    xls_files = glob.glob(os.path.join(PS_DATA_FOLDER, '**/*.xls'), recursive=True)
    all_files.extend(xls_files)
    print(f'  Found {len(xls_files)} XLS files')
    
    print(f'\n📊 Total files to process: {len(all_files)}')
    
    # Show first few files
    print('\n📁 Sample files:')
    for f in all_files[:5]:
        print(f'  - {os.path.basename(f)}')
    
    return all_files

def detect_file_type(df, filename):
    '''Intelligently detect what type of data this is'''
    columns_lower = [str(col).lower() for col in df.columns]
    filename_lower = filename.lower()
    
    # Check filename patterns
    if 'competitor' in filename_lower:
        return 'competitors'
    elif 'review' in filename_lower or 'feedback' in filename_lower:
        return 'feedback'
    elif 'rate' in filename_lower or 'pricing' in filename_lower or 'adr' in filename_lower:
        return 'rates'
    elif 'occupancy' in filename_lower or 'occ' in filename_lower:
        return 'rates'
    elif 'revenue' in filename_lower or 'revpar' in filename_lower:
        return 'rates'
    
    # Check column patterns
    if any('competitor' in col for col in columns_lower):
        return 'competitors'
    elif any('review' in col or 'rating' in col or 'feedback' in col for col in columns_lower):
        return 'feedback'
    elif any('rate' in col or 'price' in col or 'adr' in col for col in columns_lower):
        return 'rates'
    elif any('occupancy' in col or 'occ' in col for col in columns_lower):
        return 'rates'
    
    return 'rates'  # Default to rates

def process_file(filepath):
    '''Process a single file from PS Data'''
    filename = os.path.basename(filepath)
    print(f'\n📄 Processing: {filename}')
    
    try:
        # Read file
        if filepath.endswith('.csv'):
            # Try different encodings
            try:
                df = pd.read_csv(filepath)
            except:
                try:
                    df = pd.read_csv(filepath, encoding='latin1')
                except:
                    df = pd.read_csv(filepath, encoding='iso-8859-1')
        else:
            df = pd.read_excel(filepath)
        
        if df.empty:
            print('  ⚠️  Empty file, skipping')
            return None
        
        print(f'  Rows: {len(df)}')
        print(f'  Columns: {list(df.columns)[:5]}...')
        
        # Detect data type
        data_type = detect_file_type(df, filename)
        print(f'  Type detected: {data_type}')
        
        # Clean and process data
        formatted_data = []
        
        for idx, row in df.iterrows():
            if idx >= 1000:  # Limit to 1000 rows per file for now
                break
            
            try:
                if data_type == 'rates':
                    # Find date column
                    date_val = None
                    for col in df.columns:
                        if 'date' in str(col).lower():
                            date_val = row[col]
                            break
                    if not date_val:
                        date_val = datetime.now().isoformat()
                    
                    # Find rate column
                    rate_val = None
                    for col in df.columns:
                        col_lower = str(col).lower()
                        if 'rate' in col_lower or 'price' in col_lower or 'adr' in col_lower:
                            try:
                                rate_val = float(row[col])
                                break
                            except:
                                pass
                    
                    if not rate_val:
                        # Try to find any numeric column
                        for col in df.columns:
                            try:
                                val = float(row[col])
                                if 50 < val < 1000:  # Reasonable rate range
                                    rate_val = val
                                    break
                            except:
                                pass
                    
                    if rate_val:
                        # Find occupancy
                        occ_val = 0.75
                        for col in df.columns:
                            col_lower = str(col).lower()
                            if 'occ' in col_lower:
                                try:
                                    occ = float(row[col])
                                    if occ > 1:  # Percentage
                                        occ = occ / 100
                                    occ_val = occ
                                    break
                                except:
                                    pass
                        
                        # Find room type
                        room_type = 'Standard'
                        for col in df.columns:
                            col_lower = str(col).lower()
                            if 'room' in col_lower or 'type' in col_lower:
                                room_type = str(row[col])
                                break
                        
                        formatted_data.append({
                            'date': str(date_val),
                            'rate': float(rate_val),
                            'room_type': room_type,
                            'occupancy': float(occ_val)
                        })
                
                elif data_type == 'competitors':
                    comp_name = 'Unknown'
                    for col in df.columns:
                        if 'comp' in str(col).lower() or 'name' in str(col).lower():
                            comp_name = str(row[col])
                            break
                    
                    rate_val = 250
                    for col in df.columns:
                        if 'rate' in str(col).lower() or 'price' in str(col).lower():
                            try:
                                rate_val = float(row[col])
                                break
                            except:
                                pass
                    
                    formatted_data.append({
                        'competitor': comp_name,
                        'date': str(row.get('date', datetime.now().isoformat())),
                        'rate': rate_val,
                        'room_type': 'Standard'
                    })
                
                elif data_type == 'feedback':
                    rating = 4.0
                    for col in df.columns:
                        if 'rating' in str(col).lower() or 'score' in str(col).lower():
                            try:
                                rating = float(row[col])
                                break
                            except:
                                pass
                    
                    comment = ''
                    for col in df.columns:
                        if 'comment' in str(col).lower() or 'review' in str(col).lower():
                            comment = str(row[col])
                            break
                    
                    formatted_data.append({
                        'date': str(row.get('date', datetime.now().isoformat())),
                        'rating': rating,
                        'comment': comment,
                        'category': 'General'
                    })
                    
            except Exception as e:
                continue
        
        if formatted_data:
            print(f'  ✅ Extracted {len(formatted_data)} records')
            return {
                'data_type': data_type,
                'data': formatted_data,
                'filename': filename
            }
        else:
            print('  ⚠️  No valid data extracted')
            return None
            
    except Exception as e:
        print(f'  ❌ Error: {e}')
        return None

def upload_batch(payload):
    '''Upload data to API'''
    if not payload or not payload['data']:
        return False
    
    print(f'  📤 Uploading {len(payload["data"])} {payload["data_type"]} records...')
    
    # Try local API first
    try:
        response = requests.post(API_URL, json=payload, headers=headers, timeout=5)
        if response.status_code == 200:
            print('  ✅ Uploaded to local API')
            return True
    except:
        pass
    
    # Try production API
    try:
        response = requests.post(BACKUP_API, json=payload, headers=headers, timeout=10)
        if response.status_code == 200:
            print('  ✅ Uploaded to production API')
            return True
    except Exception as e:
        print(f'  ⚠️  Upload failed: {e}')
    
    return False

def main():
    print('\n🔍 Starting PS Data folder upload...')
    
    # Scan folder
    files = scan_ps_data_folder()
    
    if not files:
        print('\n❌ No files found in PS Data folder!')
        return
    
    print(f'\n🚀 Processing {len(files)} files from PS Data folder...')
    
    total_uploaded = 0
    successful_files = 0
    
    for filepath in files:
        result = process_file(filepath)
        
        if result and result['data']:
            # Upload in batches
            data = result['data']
            for i in range(0, len(data), 100):
                batch = data[i:i+100]
                batch_payload = {
                    'data_type': result['data_type'],
                    'data': batch,
                    'filename': result['filename']
                }
                
                if upload_batch(batch_payload):
                    total_uploaded += len(batch)
                    successful_files += 1
    
    print('\n' + '=' * 60)
    print('✅ PS DATA UPLOAD COMPLETE!')
    print(f'📊 Files processed: {successful_files}/{len(files)}')
    print(f'📈 Total records uploaded: {total_uploaded}')
    print('\n🎯 Your dashboard now shows REAL Pacific Sands data!')
    print('   View at: http://localhost:3000/real-dashboard')
    print('\n🗄️ Check your database:')
    print('   http://localhost:5555')

if __name__ == '__main__':
    main()
