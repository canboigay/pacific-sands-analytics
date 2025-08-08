const prisma = require('../src/lib/prisma');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    metrics = '',
    date_from,
    date_to,
    granularity = 'day',
    group_by = '',
    filters = '{}',
    limit = '500',
    sort = '',
    timezone = 'America/Vancouver',
    dry_run = 'false',
  } = req.query;

  const allowedGran = new Set(['day', 'week', 'month']);
  if (!allowedGran.has(granularity)) {
    return res.status(400).json({ error: 'invalid granularity' });
  }

  let parsedFilters = {};
  try {
    parsedFilters = filters ? JSON.parse(filters) : {};
  } catch (e) {
    return res.status(400).json({ error: 'filters must be valid JSON' });
  }

  const args = {
    metrics: String(metrics).split(',').map((s) => s.trim()).filter(Boolean),
    date_from,
    date_to,
    granularity,
    group_by: String(group_by).split(',').map((s) => s.trim()).filter(Boolean),
    filters: parsedFilters,
    limit: Number(limit) || 500,
    sort: String(sort || ''),
    timezone: String(timezone || 'America/Vancouver'),
  };

  if (dry_run === 'true') {
    return res.status(200).json({ rows: [], meta: { dry_run: true, received: args } });
  }

  const rows = await queryMetrics(args);
  return res.status(200).json({
    rows,
    meta: {
      trace_id: crypto.randomUUID(),
      cached: false,
      source_tables: ['RateRecord', 'OccupancyRecord'],
      timezone: args.timezone,
    },
  });
};

async function queryMetrics(_args) {
  return [
    { date: '2025-07-01', room_type: 'Queen Suite', adr: 189.5, revpar: 142.3, occupancy: 0.75, revenue: 12345 },
    { date: '2025-07-02', room_type: 'Queen Suite', adr: 199.0, revpar: 155.1, occupancy: 0.78, revenue: 13210 },
  ];
}
