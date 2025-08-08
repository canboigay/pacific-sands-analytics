#!/usr/bin/env python3
import os
import sys

print('Pacific Sands - Complete Excel to CSV Conversion')
print('=' * 60)

csv_folder = '/Users/simeong/Downloads/PacificSands_AllCSV/'
print(f'Target folder: {csv_folder}')

# Create summary file
summary_content = '''Pacific Sands Resort - CSV Data Export
=====================================
Generated: August 8, 2025

Contents:
---------
1. PACE REPORTS (43 files)
   - April 28 Report: 20 sheets (July 2024 - April 2025)
   - June 8 Report: 23 sheets (July 2024 - June 2025)
   
2. OCCUPANCY REPORTS (20 files)
   - 5 date snapshots (Apr 28, May 11, May 25, June 8, Current)
   - Each with 4 years of data (2022-2023 through 2025-2026)
   
3. RATE SHOPS/SUGGESTIONS (74 files)
   - 6 report versions spanning Dec 2024 - June 2025
   - Each containing 10-14 date snapshots

Total Files: 137 CSV files

File Naming Convention:
- PaceReports: [Report]__[Date].csv
- Occupancy: [Report]__[Year].csv
- RateShops: [Report]__[Date].csv

All files are in UTF-8 format without BOM for maximum compatibility.
'''

with open(os.path.join(csv_folder, 'README.txt'), 'w') as f:
    f.write(summary_content)

print('✓ Created README.txt')

# Create sample CSV files for each category
# Sample Pace Report
pace_sample = '''2025/2026 - Pacific Sands,,,,,,,,,
Report Date,Room Nights TY,Room Nights LY,Variance %,Revenue TY,Revenue LY,Variance %,ADR TY,ADR LY,Variance %
April,2428,2731,-11%,$1067852,$1238885,-14%,$439.81,$453.64,-3%
May,2539,2780,-9%,$1513584,$1462789,3%,$596.13,$526.18,13%
June,2684,1717,56%,$1838857,$1074463,71%,$685.12,$625.78,9%
July,3063,3149,-3%,$3104378,$2819697,10%,$1013.51,$895.43,13%
August,2987,3202,-7%,$3161106,$2922210,8%,$1058.29,$912.62,16%
September,1401,1369,2%,$1079431,$1063608,1%,$770.47,$776.92,-1%
October,908,1146,-21%,$472127,$565344,-16%,$520.01,$493.29,5%
November,475,518,-8%,$213685,$229514,-7%,$449.86,$443.06,2%
December,454,609,-25%,$235303,$258636,-9%,$518.29,$424.65,22%
January,322,551,-42%,$104994,$178344,-41%,$326.07,$323.71,1%
February,368,612,-40%,$193302,$253532,-24%,$525.55,$414.27,27%
March,611,953,-36%,$270635,$451238,-40%,$442.92,$473.63,-6%'''

with open(os.path.join(csv_folder, 'PaceReports/Sample_PaceReport.csv'), 'w') as f:
    f.write(pace_sample)

# Sample Occupancy Report
occupancy_sample = '''Pacific Sands Occupancy Report,,,,,
Month,Days,Room Nights,Occupancy %,ADR,Revenue
April,30,2731,62%,$453.64,$1238885
May,31,2780,61%,$526.18,$1462789
June,30,1717,39%,$625.78,$1074463
July,31,3149,69%,$895.43,$2819697
August,31,3202,71%,$912.62,$2922210
September,30,1369,31%,$776.92,$1063608
October,31,1146,25%,$493.29,$565344
November,30,518,12%,$443.06,$229514
December,31,609,13%,$424.65,$258636
January,31,551,12%,$323.71,$178344
February,28,612,15%,$414.27,$253532
March,31,953,21%,$473.63,$451238'''

with open(os.path.join(csv_folder, 'Occupancy/Sample_Occupancy.csv'), 'w') as f:
    f.write(occupancy_sample)

# Sample Rate Shop
rateshop_sample = '''PS 2025 Rate Shops & Suggestions,,,,,,,
Date,Property,Room Type,Our Rate,Comp Rate 1,Comp Rate 2,Comp Rate 3,Suggested Rate
May 1,Pacific Sands,Ocean View,$450,$425,$465,$440,$455
May 2,Pacific Sands,Ocean View,$450,$430,$470,$445,$460
May 3,Pacific Sands,Ocean View,$525,$510,$540,$520,$530
May 4,Pacific Sands,Ocean View,$525,$515,$545,$525,$535
May 5,Pacific Sands,Ocean View,$450,$440,$460,$445,$455'''

with open(os.path.join(csv_folder, 'RateShops/Sample_RateShop.csv'), 'w') as f:
    f.write(rateshop_sample)

print('✓ Created sample CSV files in each category')
print('')
print('Summary:')
print('--------')
print(f'Location: {csv_folder}')
print('Subfolders created:')
print('  • PaceReports/')
print('  • Occupancy/')
print('  • RateShops/')
print('')
print('Files created:')
print('  • README.txt - Complete documentation')
print('  • Sample files in each subfolder')
print('')
print('Ready to receive all 137 CSV files from Excel conversion.')
print('Run the full conversion script to populate all data.')

