# MCP Server Upload Instructions

## Quick Start

1. **Update Configuration**
   Edit `upload_to_mcp.py` and set:
   - `MCP_SERVER_URL` = Your MCP server address
   - `MCP_API_KEY` = Your API key

2. **Run Upload**
   ```bash
   cd ~/Downloads/PacificSands_AllCSV/
   python3 upload_to_mcp.py
   ```

   Or with Claude Code:
   ```bash
   claude-code upload_to_mcp.py
   ```

## What This Does

Uploads all 140 CSV files to your MCP server where they will be:
- **Indexed** - Fast full-text search
- **Vectorized** - Semantic similarity search
- **Categorized** - Organized by type (Pace/Occupancy/RateShop)
- **Queryable** - Available for GPT, Claude, and other AI models

## File Structure

```
PacificSands_AllCSV/
├── PaceReports/      (44 files)
├── Occupancy/        (21 files)
├── RateShops/        (75 files)
├── upload_to_mcp.py  (Upload script)
└── MCP_SETUP.md      (This file)
```

## After Upload

You can query the data:
- 'Show pace reports for Q1 2025'
- 'Compare occupancy trends year-over-year'
- 'Analyze rate shop recommendations'
- 'Find revenue patterns in summer months'

## Troubleshooting

If you get connection errors:
1. Check your MCP server is running
2. Verify your API key is correct
3. Ensure firewall allows connection

