import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { inspection } = req.body;
    if (!inspection?.id) return res.status(400).json({ error: 'Missing inspection id' });

    // Strip any base64 photos before saving to cloud — only keep Blob URLs (https://)
    // Base64 photos are kept locally; once uploaded they become URLs
    const sanitizedPhotos = {};
    Object.entries(inspection.photos || {}).forEach(([key, arr]) => {
      sanitizedPhotos[key] = (arr || []).filter(src => typeof src === 'string' && src.startsWith('https://'));
    });

    const data = {
      ...inspection,
      photos: sanitizedPhotos,
      syncedAt: new Date().toISOString(),
    };

    const blob = await put(
      `inspections/${inspection.id}.json`,
      JSON.stringify(data),
      {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: 'application/json',
        addRandomSuffix: false,
      }
    );

    return res.status(200).json({ ok: true, url: blob.url });
  } catch (err) {
    console.error('save-inspection error:', err);
    return res.status(500).json({ error: err.message });
  }
}
