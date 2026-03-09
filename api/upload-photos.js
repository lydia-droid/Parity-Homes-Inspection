import { put } from '@vercel/blob';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { photos, inspectionId } = await req.json();

    if (!photos || !Array.isArray(photos)) {
      return new Response(JSON.stringify({ error: 'No photos provided' }), { status: 400 });
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

    return new Response(JSON.stringify({ urls }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Photo upload error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
