import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { photos, inspectionId } = req.body;

    if (!photos || !Array.isArray(photos)) {
      return res.status(400).json({ error: 'No photos provided' });
    }

    const urls = await Promise.all(photos.map(async ({ data, filename }) => {
      // Strip base64 prefix (e.g. "data:image/jpeg;base64,")
      const base64 = data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      const ext = data.startsWith('data:image/png') ? 'png' : 'jpg';
      const name = `inspections/${inspectionId}/${filename || Date.now()}.${ext}`;

      const blob = await put(name, buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
      });

      return blob.url;
    }));

    return res.status(200).json({ urls });

  } catch (err) {
    console.error('Photo upload error:', err);
    return res.status(500).json({ error: err.message });
  }
}
