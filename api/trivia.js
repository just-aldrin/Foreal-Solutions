// Server-side only: reads GEMINI_API_KEY from the environment (set it in
// Vercel: Project Settings -> Environment Variables). The key never
// reaches the browser -- the frontend only calls this endpoint.

const CATEGORIES = [
  { key: 'startups', label: 'startup lessons', angle: 'A specific early-stage tradeoff, customer interview, or experiment a small team could run.' },
  { key: 'project-management', label: 'project management', angle: 'A concrete tactic for scope creep, dependencies, handoffs, or deciding what ships.' },
  { key: 'agriculture', label: 'agriculture', angle: 'An everyday farming or food-supply problem, with a clear explanation of how it happens.' },
  { key: 'agrichain', label: 'AgriChain', angle: 'Connect a food-supply question to what AgriChain was built to do.' },
  { key: 'foreal', label: 'Foreal Solutions', angle: 'Find a sharp detail in the student-led startup journey. Mention WVSU, CICT, or BINHI only if it explains how the team got support.' },
  { key: 'motivation', label: 'startup motivation', angle: 'Give encouragement tied to a concrete action a founder can take after a rejection or setback.' },
  { key: 'quotes', label: 'startup quote', angle: 'Write an original, quotable line about building a startup. Never attribute it to a real person.' },
  { key: 'tech', label: 'technology', angle: 'Explain one useful technical idea or tradeoff through an everyday example.' },
];

// Grounding facts, pulled from the Foreal team's own posts and verified
// public sources (WVSU's own site, news coverage). Nothing outside these
// lists should ever be presented as fact for these categories -- the
// model is told to use ONLY what's listed, never add to it.
const FACTS = {
  agrichain: `
- AgriChain is a decision-support system built by the Foreal Solutions team.
- A conversation over a Cornetto sparked a question about rising food prices.
- It uses predictive analytics and machine learning to connect agricultural supply with demand.
- It started from a real conversation about why food prices keep rising, between Meryll Klaryze Polaron, Mikaela Angela Patopaten, and Florence Elaine Soleno -- later joined by Zalve Mae Magsael and Aldrin Bansuelo.
- It was built for the DAP-NextGenPH Startup Challenge 2025.
- The goal is to help close the information gap between farmers and buyers so price swings make more sense.
`.trim(),
  foreal: `
- Foreal Solutions is a student-led technology studio based in Iloilo City, Philippines, started in 2025.
- It grew out of the AgriChain idea above.
- On October 28, 2025, Foreal Solutions signed a formal partnership with DOST and WVSU's BINHI Technology Business Incubator.
- The team is affiliated with WVSU CICT (College of Information and Communications Technology).
- Foreal's four pillars: Technology, Innovation, Collaboration, Impact.
- Mission: empower communities through student-led innovation with accessible, data-driven, sustainable digital solutions.
- Vision: become a student-led technology startup that creates impact not only for the people, but by the people.
`.trim(),
};

export default async function handler(request, response) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return response.status(503).json({ error: 'Trivia generator is not configured.' });

  const topics = CATEGORIES.filter(({ key }) => key !== request.query?.previousCategory);
  const category = topics[Math.floor(Math.random() * topics.length)];
  const grounded = FACTS[category.key];

  // The client sends the last few facts it already showed this session so
  // we can actively steer away from repeats, not just hope temperature
  // handles it.
  let avoid = [];
  try {
    const raw = request.query?.avoid;
    if (raw) avoid = String(raw).split('|').map((s) => s.trim().slice(0, 230)).filter(Boolean).slice(0, 8);
  } catch (e) {}

  const promptParts = [
    'Write one short card for Foreal Solutions’ Behind the Build widget.',
    `Topic: ${category.label}. Angle: ${category.angle}`,
    'Use 1–2 sentences and at most 230 characters. Sound like a teammate who learned something worth sharing. Use wit when it clarifies the point. Skip campus trivia, startup clichés, generic hype, emojis, hashtags, and Markdown.',
    'Never hallucinate. Do not invent, round, or guess at any number, date, name, or statistic beyond what is given to you.',
    grounded
      ? `Use ONLY these real facts for this one -- do not add any detail beyond them, and do not contradict them. Find the most interesting angle or connection between them rather than restating one flatly:
${grounded}`
      : 'Stick to safe, widely-known, easily verifiable facts about this topic -- nothing obscure, nothing you are not fully confident is true -- but pick the genuinely interesting one, not the first thing that comes to mind.',
  ];
  if (avoid.length) {
    const avoidLines = avoid.map((a) => '- ' + a).join(String.fromCharCode(10));
    promptParts.push(
      'Do not repeat or closely resemble any of these lines already shown this session:' + String.fromCharCode(10) + avoidLines
    );
  }
  promptParts.push('Return only the card text.');
  const prompt = promptParts.join(String.fromCharCode(10));

  try {
    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 1, maxOutputTokens: 512 },
        }),
      }
    );
    if (!geminiRes.ok) {
      return response.status(502).json({ error: 'Trivia generation failed.' });
    }
    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.filter((part) => !part.thought)
      .map((part) => part.text).join('').trim();
    if (!text || text.length > 230) return response.status(502).json({ error: 'Invalid card from model.' });
    return response.status(200).json({ trivia: text, category: category.key, label: category.label });
  } catch (error) {
    return response.status(502).json({ error: 'Trivia generation failed.' });
  }
}
