import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { blobs } = await list({
      prefix: 'inspections/',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Only include inspection JSON files (not photos)
    // Pattern: inspections/{id}.json  (no slashes in id segment after the prefix)
    const jsonBlobs = blobs.filter(b => /^inspections\/[^/]+\.json$/.test(b.pathname));

    // Fetch all inspection data in parallel
    const results = await Promise.all(
      jsonBlobs.map(async (blob) => {
        try {
          const r = await fetch(blob.url);
          if (!r.ok) return null;
          return await r.json();
        } catch {
          return null;
        }
      })
    );

    const inspections = results
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    return res.status(200).json({ inspections });
  } catch (err) {
    console.error('list-inspections error:', err);
    return res.status(500).json({ error: err.message });
  }
}
