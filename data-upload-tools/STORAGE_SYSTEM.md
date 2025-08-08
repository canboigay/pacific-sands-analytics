# 📂 Enhanced Storage System for Pacific Sands Analytics

## ✅ Organized File Structure

Your data is automatically organized into:

```
/tmp/pacific-sands-data/
├── competitors/
│   ├── pricing/           # Scraped competitor rates
│   └── reviews/           # Competitor reviews
├── social-media/
│   ├── mentions/          # Social media mentions
│   └── sentiment/         # Sentiment analysis data
├── manual-uploads/
│   ├── rates/            # Your uploaded rate data
│   ├── bookings/         # Your uploaded booking data
│   └── reviews/          # Your uploaded review data
├── knowledge-base/
│   └── insights/         # GPT-generated insights
├── analytics/
│   └── forecasts/        # Rate forecasts
├── csv-exports/          # Auto-generated CSV files
└── backups/
    ├── daily/           # Daily backups
    └── weekly/          # Weekly backups
```

## 📊 File Naming Convention

All files are automatically named with:
- **Data type**: `competitors`, `mentions`, `rates`, etc.
- **Date**: `YYYY-MM-DD` format
- **Timestamp**: Full timestamp for uniqueness

Example: `competitors_2025-08-08_2025-08-08T14-30-22-123Z.json`

## 🔧 New Storage Management Endpoints

### Get Storage Statistics
```bash
GET /api/storage/stats
Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k
```

Returns:
```json
{
  "storage_stats": {
    "totalFiles": 156,
    "totalSizeMB": "45.2",
    "dataTypes": {
      "competitors": {"files": 45, "size": 12582912},
      "mentions": {"files": 78, "size": 8934567}
    },
    "oldestRecord": "2025-07-01T00:00:00.000Z",
    "newestRecord": "2025-08-08T14:30:22.123Z"
  }
}
```

### Cleanup Old Files
```bash
POST /api/storage/cleanup
Content-Type: application/json
Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k

{
  "days_to_keep": 90
}
```

### Export for Database Migration
```bash
GET /api/storage/export
Authorization: Bearer ps_me2w0k3e_x81fsv0yz3k
```

## 💾 Dual Storage System

**JSON Files** (Primary)
- Complete metadata and structure
- Easy to parse and analyze
- Organized by date and type

**CSV Exports** (Secondary)
- Automatic CSV generation
- Easy Excel compatibility
- Quick data analysis

## 📈 Data Persistence Features

✅ **Automatic JSON + CSV backup**
✅ **Organized folder structure**
✅ **Metadata tracking**
✅ **Date range filtering**
✅ **Storage statistics**
✅ **Cleanup management**
✅ **Database export ready**

## 🚀 Future Database Migration

When ready to scale to a database:

1. **Export data**: Use `/api/storage/export` endpoint
2. **Get organized JSON**: All data formatted for database import
3. **Switch storage**: Update `StorageManager` to use database
4. **Zero downtime**: API endpoints remain the same

## 📊 Data Analytics Benefits

- **Historical analysis**: Load data by date ranges
- **Trend analysis**: Compare metrics over time
- **Performance tracking**: Monitor data collection success
- **Storage optimization**: Automatic cleanup and management

Your system can handle **years of data** with this enhanced storage while maintaining fast performance and easy scaling to a database when needed! 🎯