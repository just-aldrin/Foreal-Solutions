const key = 'foreal:presence';

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return response.status(503).json({ error: 'Presence storage is not configured.' });
  const id = String(request.query.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
  if (!id) return response.status(400).json({ error: 'Visitor id is required.' });
  const now = Date.now();
  const commands = [['ZADD', key, now, id], ['ZREMRANGEBYSCORE', key, 0, now - 45000], ['ZCARD', key]];
  const result = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(commands) });
  if (!result.ok) return response.status(502).json({ error: 'Presence storage failed.' });
  const values = await result.json();
  return response.status(200).json({ count: Number(values[2]?.result || 0) });
}
