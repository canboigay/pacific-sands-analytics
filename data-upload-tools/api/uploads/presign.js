const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { filename, content_type, purpose } = req.body || {};
  if (!filename || !content_type) {
    return res.status(400).json({ error: 'filename and content_type required' });
  }

  const file_id = crypto.randomUUID();
  const key = `uploads/${file_id}-${filename}`;
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: content_type,
    Metadata: { purpose: String(purpose || 'user_upload') },
  });
  const upload_url = await getSignedUrl(s3, command, { expiresIn: 300 });

  return res.status(200).json({
    upload_url,
    file_id,
    key,
    expires_at: new Date(Date.now() + 300000).toISOString(),
  });
};
