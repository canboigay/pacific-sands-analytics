const prisma = require('../../src/lib/prisma');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { file_id, key, bytes, content_type, tags, purpose, filename, source } = req.body || {};
  if (!file_id || !key) {
    return res.status(400).json({ error: 'file_id and key required' });
  }

  const record = await prisma.uploadMetadata.create({
    data: {
      id: file_id,
      filename: filename || key.split('/').pop() || 'upload',
      dataType: purpose || 'unknown',
      recordsCount: 0,
      source: source || 'user_upload',
      fileSize: typeof bytes === 'number' ? bytes : bytes ? Number(bytes) : null,
      purpose: purpose || null,
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === 'string' && tags
        ? tags.split(',').map((s) => s.trim())
        : [],
    },
  });

  return res.status(200).json({ ...record, message: 'stored' });
};
