# LLM ARENA

**Privacy-first AI model comparison platform. Compare GPT-5.4, Claude Sonnet 5, Gemini 3.8 Flash & Grok 4.6 side-by-side. AI judge evaluates winners. Pay-per-use credits, no subscriptions.**

This is a **Next.js App Router** app, deployable on Vercel. Use your own API keys. Replit is not required.

---

## Overview

Arena AI lets you submit a single prompt and instantly compare responses from leading AI models. See how GPT-5.4, Claude Sonnet 5, Gemini 3.8 Flash, and Grok 4.6 tackle the same challenge — all in one view.

### Why Arena AI?

- **Save Time**: No more switching between ChatGPT, Claude, and Gemini tabs
- **Privacy First**: We never store your prompts or AI responses
- **Pay What You Use**: No monthly subscriptions, just prepaid credits
- **Unbiased Comparison**: Blind Mode hides model names until you vote

---

## Features

### Model Comparison
Submit one prompt, get responses from up to 4 AI models simultaneously:
- **GPT-5.4** (OpenAI)
- **Claude Sonnet 5** (Anthropic)
- **Gemini 3.8 Flash** (Google)
- **Grok 4.6** (xAI via OpenRouter)

App-level IDs stay `gpt-4o`, `claude-sonnet`, `gemini-flash`, and `grok` so existing battle history and API payloads stay compatible. Provider slugs live in `shared/models.ts`.

### Caesar Judge
An AI-powered evaluation system that analyzes all responses and declares a winner based on:
- Accuracy
- Clarity
- Creativity
- Safety

Caesar provides a confidence score, detailed reasoning, and score breakdown for each model. Default judge engine: Gemini 3.8 Flash.

### Maximus
The ultimate synthesizer. Maximus reads all model responses and forges the best possible answer by combining the strongest insights from each. Default engine: Gemini 3.8 Flash, with fallback to Grok then GPT-5.4 if the primary engine fails.

### Blind Mode
Toggle Blind Mode to hide model identities during comparison. Models appear as "Contender A", "Contender B", etc. — revealing their true names only after you vote or request Caesar's verdict.

### Battle History
Your last 10 comparisons are stored locally in your browser. Reload previous battles without re-running them.

### Download Reports
Export full comparison reports in PDF, Markdown, or JSON format — including all responses and Caesar's verdict.

### Logit Run Game
Educational minigame where you predict the most likely next token. Features:
- **Language Mode**: 30 levels across Idiom, Code, Movie, Fact, and Logic categories
- **Math Mode**: 30 levels covering Arithmetic, Geometric, Fibonacci, Squares/Cubes, Constants, and Binary/Hex patterns

---

## Privacy

Arena AI is built with a **zero data collection** policy for user content:

| What We Store | What We NEVER Store |
|---------------|---------------------|
| Credit balance | Your prompts |
| Stripe customer ID | AI responses |
| Usage timestamps | Model selections |
| Credits spent | Conversation history |

Your prompts and AI responses exist only in your browser session.

---

## Credit Pricing

Tiers are defined once in `shared/models.ts` and used by both the compare route and the home page.

### Model Comparison
| Models Selected | Credits |
|-----------------|---------|
| 1 model | 3 |
| 2 models | 5 |
| 3 models | 7 |
| 4 models | 10 |

### Add-ons
| Feature | Credits |
|---------|---------|
| Caesar Judge | +3 |
| Maximus | +5 |

### Credit Packs
Purchase credits via Stripe — no subscriptions required.

| Pack | Credits | Price |
|------|---------|-------|
| Starter | 25 | $3.00 |
| Challenger | 100 | $10.00 |
| Pro | 300 | $25.00 |
| Ultimate | 1000 | $50.00 |

---

## Tech Stack

### App
- Next.js 15 App Router + TypeScript
- React 18
- Tailwind CSS
- Shadcn/ui (Radix UI)
- TanStack Query

### Data
- Drizzle ORM
- PostgreSQL (Neon) — `DATABASE_URL` only; not Supabase

### AI Providers
- OpenAI (GPT-5.4)
- Anthropic (Claude Sonnet 5)
- Google GenAI (Gemini 3.8 Flash)
- OpenRouter (Grok 4.6)

### Payments
- Stripe Checkout + webhooks

---

## Getting Started (local)

### Prerequisites
- Node.js 18+
- A Neon (or other Postgres) `DATABASE_URL`
- Provider keys for the models you want to call
- Stripe keys if you want credit purchases

### Environment Variables

Copy `.env.example` to `.env.local` and fill in values. **Never commit secrets.**

**Required at runtime**
- `DATABASE_URL` — Neon/Postgres connection string. Guest tokens live in the DB. The client is created lazily so `next build` does not require this variable.

**Optional at boot (recommended for a full compare)**
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY` (or `GOOGLE_API_KEY`)
- `OPENROUTER_API_KEY`

Missing AI keys do not crash the process. Compare still returns; that model’s card shows an error.

**Stripe (required only for purchases / webhooks)**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` (was `VITE_STRIPE_PUBLIC_KEY`)

The app boots without Stripe. Checkout fails with a clear error until `STRIPE_SECRET_KEY` is set.

**Optional**
- `NEXT_PUBLIC_APP_URL` — fallback origin for Stripe redirects. On Vercel, `VERCEL_URL` / the request `Origin` header are used automatically.

### Installation

```bash
cp .env.example .env.local
# edit .env.local with your keys

npm install

# Push database schema (needs DATABASE_URL)
npm run db:push

# Dev server (Next.js — API routes + UI)
npm run dev
```

The app will be available at `http://localhost:3000`.

```bash
# Typecheck
npm run check

# Production build
npm run build
npm start
```

### Local Stripe webhooks

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Use the CLI `whsec_...` as `STRIPE_WEBHOOK_SECRET`. The webhook handler reads the **raw body** via `request.text()` and verifies `stripe-signature`.

---

## Authentication

Guest tokens are the **primary and only** path right now.

1. **Guest Mode**: Create a token on the landing page. Credits are tied to that token in the database and stored in `localStorage` in this browser.
2. **Signed-in accounts**: Not wired in this rewrite. `getSessionUser()` in `lib/session.ts` is the hook point for Auth.js (Google/GitHub) later. Do not wire callers back to Replit.

Old login URLs (`/api/login`, `/api/callback`, `/api/logout`, `/api/link-guest-account`) return `410 Gone`.

The `/admin` UI and `/api/admin/*` routes require a signed-in user with `isAdmin`. Until Auth.js is added, those endpoints return 401 and the admin page shows access denied. Gift-credits is implemented and gated behind `requireAdmin` → `user.isAdmin`.

---

## Deploy on Vercel

### Import the repo

1. [Import](https://vercel.com/new) `iliarafa/llmarena` (or your fork) into Vercel.
2. Framework Preset: **Next.js** (auto-detected). Root directory: repo root. No `vercel.json` is required.
3. Add the environment variables below to **Production** and **Preview**.
4. Deploy.

### Environment variables on Vercel

| Name | Required | Notes |
|------|----------|-------|
| `DATABASE_URL` | Yes (runtime) | Neon connection string, `sslmode=require` |
| `STRIPE_SECRET_KEY` | For purchases | |
| `STRIPE_WEBHOOK_SECRET` | For purchases | From Stripe Dashboard → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | For purchases | Publishable key |
| `OPENAI_API_KEY` | Recommended | GPT-5.4 |
| `ANTHROPIC_API_KEY` | Recommended | Claude Sonnet 5 |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Recommended | Gemini 3.8 Flash (or `GOOGLE_API_KEY`) |
| `OPENROUTER_API_KEY` | Recommended | Grok 4.6 |

After the first deploy, set the Stripe webhook URL to:

```
https://<your-vercel-domain>/api/stripe-webhook
```

Events: `checkout.session.completed`.

### Vercel settings for compare

`POST /api/compare` fans out to up to 4 providers, then optionally Caesar and Maximus. That can take well over 60 seconds.

This route sets:

```ts
export const maxDuration = 300;
export const runtime = "nodejs";
```

**Required on the Vercel project (Pro recommended):**

1. Enable **Fluid Compute** (default on new projects).
2. In Project Settings → Functions, set **Max Duration** to **300 seconds** (or at least as high as `maxDuration`).
3. Hobby is too short for a full 4-model compare + Caesar + Maximus. Use **Pro**.

The compare handler still returns one JSON payload (same product contract as the Express app). Keeping the work in a single Node function avoids storing prompts or responses.

### Database

Point `DATABASE_URL` at the existing Neon database. Run `npm run db:push` once against that database if the schema is not already applied. Do **not** migrate to Supabase.

---

## Architecture (what moved)

| Before (Express + Vite) | After (Next.js App Router) |
|-------------------------|----------------------------|
| `server/index.ts` + Vite middleware | `next dev` / `next start` |
| `server/routes.ts` | `app/api/**/route.ts` |
| `server/llm.ts`, `storage.ts`, `db.ts` | `lib/llm.ts`, `lib/storage.ts`, `lib/db.ts` |
| `server/authMiddleware.ts` | `lib/session.ts` (`getIdentity`, `requireAuth`, `requireAdmin`, `getSessionUser`) |
| `client/src/pages/*` | `components/pages/*` + `app/*/page.tsx` |
| `client/src/components` | `components/` |
| `VITE_STRIPE_PUBLIC_KEY` | `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` |
| Port 5000 | Port 3000 |

Shared source of truth is unchanged: `shared/models.ts` (IDs, labels, credit tiers) and `shared/schema.ts` (Drizzle).

---

## Verify locally

1. `npm install && npm run check && npm run build`
2. Set `DATABASE_URL` in `.env.local`, run `npm run db:push`, then `npm run dev`
3. Open `http://localhost:3000` → Create Guest Token → Continue to Arena
4. Buy credits (Stripe test mode) or gift via admin once Auth.js + `isAdmin` exist
5. Select 2+ models, run a compare, optionally enable Caesar and Maximus
6. Confirm battle history is only in the browser; dashboard shows timestamps + credits only

---

## License

MIT

---

## Version

v1.2
