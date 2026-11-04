export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method not allowed' });
  const { name, email, project, details, company = '' } = request.body || {};
  if (!name || !email || !project || !details) return response.status(400).json({ error: 'Name, email, project, and details are required.' });
  const payload = { name, email, company, project, details, receivedAt: new Date().toISOString() };
  if (!process.env.INQUIRY_WEBHOOK_URL) return response.status(503).json({ error: 'Inquiry delivery is not configured.' });
  const delivered = await fetch(process.env.INQUIRY_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!delivered.ok) return response.status(502).json({ error: 'Inquiry delivery failed.' });
  return response.status(201).json({ ok: true });
}
