# SkillVerse AI 2.0 — Deep-Tech Learning OS

A hackathon-ready web app prototype centered on an interactive 3D deep-tech simulator, with a server-side AI tutor endpoint, Supabase authentication wiring, user-owned progress storage, roadmap generation, and portfolio drafting.

## What's actually implemented

- **3D simulator:** Three.js scenes for a neural-network field, robot navigation, computer vision, and a cybersecurity shield. Drag to rotate and scroll to zoom. These are visual learning simulations, not hardware control.
- **Mission briefs:** The Run Mission control creates educational prompts for the selected scene.
- **Roadmap builder:** Generates a four-week rule-based learning plan locally.
- **Portfolio studio:** Drafts a project summary locally from the user's inputs.
- **AI tutor backend:** Express endpoint `/api/ai/tutor` uses a server-side OpenAI-compatible chat-completions API. It becomes live only after `OPENAI_API_KEY` is configured.
- **Authentication wiring:** Supabase email/password sign-up/sign-in in the browser, activated by adding the project URL and publishable/anon key to `public/config.js`.
- **Cloud progress:** Saves generated roadmaps to `public.learning_progress`; run `supabase/schema.sql` first. RLS policies restrict rows to the signed-in owner.
- **Operations basics:** Helmet headers, JSON size limit, rate limiting on API routes, health endpoint, Dockerfile and Render blueprint.

## Not implemented / requires external setup

- The anonymous static preview cannot run the Express backend; the AI tutor uses a local fallback there.
- No API key, Supabase project, production database, email provider, or paid service credentials are included in this ZIP.
- Job listings, employer integrations, recognized certifications, real robot hardware, and formal skill validation are not connected.
- The roadmap and portfolio tools are rule-based/local; only the AI tutor endpoint uses a live language model when configured.

## Run locally

Requires Node.js 20+.

```bash
cp .env.example .env
npm install
npm start
```

Open `http://localhost:3000`. Without `OPENAI_API_KEY`, the app runs, `/api/health` reports `aiConfigured: false`, and `/api/ai/tutor` returns a helpful 503 configuration error.

## Enable the AI tutor

Add your key to the server's `.env` (never to browser code):

```env
OPENAI_API_KEY=your_server_side_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

`OPENAI_BASE_URL` can point to an OpenAI-compatible provider. Restart the server. Keep the key in the hosting provider's secret/environment settings in production.

## Enable Supabase auth and cloud saves

1. Create a Supabase project.
2. In SQL Editor, run `supabase/schema.sql`.
3. In `public/config.js`, set the project URL and **publishable/anon key** only:

```js
window.__SKILLVERSE_CONFIG__ = {
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY',
  apiBase: ''
};
```

4. Configure allowed site URLs and email confirmation settings in Supabase Auth.
5. Do **not** expose a Supabase `service_role` key. The SQL enables RLS and restricts each row to its owner.

If deploying the frontend and API separately, set `apiBase` to the backend's HTTPS origin and configure appropriate CORS policy on the server before production use. The included default assumes frontend and backend are served from the same origin.

## Deploy

### Render

- Push this folder to a GitHub repository.
- Create a Render Web Service from the repo, or use `render.yaml`.
- Add `OPENAI_API_KEY` in Render's secret environment variables.
- Add your Supabase URL and publishable key in `public/config.js` before build, or configure a proper build-time config mechanism.
- Check `/api/health` after deployment.

### Docker

```bash
docker build -t skillverse-ai .
docker run --rm -p 3000:3000 --env-file .env skillverse-ai
```

## API

- `GET /api/health` — readiness and provider configuration status (never returns secrets).
- `POST /api/ai/tutor` — JSON body: `{ "question": "...", "domain": "...", "level": "...", "goal": "..." }`.

The tutor endpoint limits question length, applies a basic per-IP rate limit, times out upstream calls, and does not persist prompts. Before production, add authentication enforcement, usage quotas, stronger abuse protection, structured logging/monitoring, privacy review, and tests.

## Test checklist

- `npm run check`
- `npm start`, then open `/api/health`
- With no key, `/api/ai/tutor` should return HTTP 503 without leaking configuration.
- Configure Supabase, sign in, run the SQL, generate a roadmap and save it.
- Test responsive layout, reduced-width screens, and the simulator on a device with WebGL support.

## Stack

HTML/CSS/JavaScript, Three.js, Node.js, Express, OpenAI-compatible API, Supabase Auth/Postgres/RLS, Docker, Render.
