import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '20kb' }));
app.use('/api/', rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  service: 'SkillVerse AI API',
  aiConfigured: Boolean(process.env.OPENAI_API_KEY),
  supabaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
  timestamp: new Date().toISOString()
}));

app.post('/api/ai/tutor', async (req, res) => {
  const { question, domain = 'Deep tech', level = 'Beginner', goal = '' } = req.body ?? {};
  if (typeof question !== 'string' || !question.trim() || question.length > 3000) {
    return res.status(400).json({ error: 'Provide a question of 1–3000 characters.' });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AI provider is not configured. Set OPENAI_API_KEY on the server.' });
  }
  const endpoint = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '') + '/chat/completions';
  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: 'system', content: 'You are SkillVerse Mentor, an encouraging and careful deep-tech learning coach. Give practical, level-appropriate steps, examples and one small exercise. Explain uncertainty. For robotics, security and AI agents, prefer sandboxed simulations, least privilege, privacy and human oversight. Do not claim credentials, live job access, or guaranteed outcomes.' },
          { role: 'user', content: `Domain: ${String(domain).slice(0,120)}\nLevel: ${String(level).slice(0,40)}\nGoal: ${String(goal).slice(0,400)}\nQuestion: ${question.trim()}` }
        ]
      }),
      signal: AbortSignal.timeout(25_000)
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : 502;
      return res.status(status).json({ error: data?.error?.message || 'AI provider request failed.' });
    }
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) return res.status(502).json({ error: 'AI provider returned an empty response.' });
    return res.json({ answer, model: data.model || process.env.OPENAI_MODEL || 'configured-model' });
  } catch (err) {
    const timeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return res.status(timeout ? 504 : 502).json({ error: timeout ? 'AI provider timed out. Please retry.' : 'Unable to reach the AI provider.' });
  }
});

app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use((err, _req, res, _next) => {
  console.error('Request error:', err?.message || 'unknown');
  res.status(500).json({ error: 'Unexpected server error.' });
});
app.listen(port, () => console.log(`SkillVerse AI listening on http://localhost:${port}`));
