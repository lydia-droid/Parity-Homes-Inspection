import { list, del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing inspection id' });

    // Find and delete the inspection JSON
    const { blobs } = await list({
      prefix: `inspections/${id}`,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (blobs.length) {
      await del(
        blobs.map(b => b.url),
        { token: process.env.BLOB_READ_WRITE_TOKEN }
      );
    }

    return res.status(200).json({ ok: true, deleted: blobs.length });
  } catch (err) {
    console.error('delete-inspection error:', err);
    return res.status(500).json({ error: err.message });
  }
}
