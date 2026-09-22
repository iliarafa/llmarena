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
- Auth.js (NextAuth v5) — Google and GitHub

### Data
- Drizzle ORM (`drizzle-orm/node-postgres` + `pg`)
- Supabase Postgres — `DATABASE_URL` only. Not the Supabase JS client or Supabase Auth.

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
- A Supabase Postgres `DATABASE_URL` (direct or pooler)
- Provider keys for the models you want to call
- Stripe keys if you want credit purchases

### Environment Variables

Copy `.env.example` to `.env.local` and fill in values. **Never commit secrets.**

**Required at runtime**
- `DATABASE_URL` — Supabase Postgres connection string (Dashboard → Project Settings → Database). The pooler URI on port 6543 is recommended. Guest tokens live in the DB. The client is created lazily so `next build` does not require this variable. Dashboard URLs include `?sslmode=require`; that works as-is (see Database SSL below).

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

**Auth.js (required only for Google / GitHub sign-in)**

Guest mode works without these. See [Authentication](#authentication) for OAuth app setup.

- `AUTH_SECRET` — encrypts the session JWT. `openssl rand -base64 32`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth client (Auth.js names, not `AUTH_GOOGLE_CLIENT_ID`)
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — GitHub OAuth app
- `AUTH_URL` — canonical origin with no path, e.g. `https://llmarena-rafa1l.vercel.app`. Optional on Vercel (`VERCEL` turns on `trustHost`, so the callback host follows the request). `NEXTAUTH_URL` is the v4 alias and is used only when `AUTH_URL` is unset.

### Installation

```bash
cp .env.example .env.local
# edit .env.local with your keys

npm install

# Push database schema (needs DATABASE_URL from the environment, .env.local, or .env)
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

Two paths, both live:

1. **Guest Mode**: "Continue as guest" creates a token. Credits stay on that token in the database and in `localStorage` in this browser. API calls send `Authorization: Bearer <token>`.
2. **Signed-in accounts**: Auth.js (NextAuth v5) with Google and GitHub. `getSessionUser()` reads the session cookie and returns the matching `users` row (created on first sign-in). New accounts start at **0** credits, the same default as a new guest token. `requireAdmin` allows the account through when `users.isAdmin` is true. There is no admin-promotion UI — set `is_admin` in the database.

When both a session and a guest token are present, APIs use the **account**. Signing in from a browser that still has a guest token calls `POST /api/link-guest-account`, which moves that token's credits and usage history onto the user and then clears the local token. Balances are not merged any other way.

Provider account ids (Google `sub`, GitHub id) are stored on the encrypted session JWT. The `users` table has no accounts columns; the same email from either provider maps to one row. `isAdmin` and `creditBalance` are never reset on later sign-ins.

### OAuth apps

Register these redirect URIs (Auth.js callback paths):

| Environment | Google | GitHub |
|-------------|--------|--------|
| Local | `http://localhost:3000/api/auth/callback/google` | `http://localhost:3000/api/auth/callback/github` |
| Production | `https://llmarena-rafa1l.vercel.app/api/auth/callback/google` | `https://llmarena-rafa1l.vercel.app/api/auth/callback/github` |
| Alternate production host | `https://llmarena-coral.vercel.app/api/auth/callback/google` | `https://llmarena-coral.vercel.app/api/auth/callback/github` |

**Google Cloud**

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an OAuth client ID of type **Web application**.
3. Authorized redirect URIs: the Google URLs in the table above (add localhost for dev).
4. Copy the client id into `AUTH_GOOGLE_ID` and the client secret into `AUTH_GOOGLE_SECRET`.

**GitHub**

1. Open GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
2. Homepage URL: `https://llmarena-rafa1l.vercel.app` (or `http://localhost:3000` for a local-only app).
3. Authorization callback URL: the GitHub URL for that host. GitHub allows one callback URL per OAuth app, so use a separate app for localhost if you need both.
4. Copy the client id into `AUTH_GITHUB_ID` and generate a client secret for `AUTH_GITHUB_SECRET`.

Set `AUTH_SECRET` everywhere Auth.js runs. Set `AUTH_URL` to the canonical origin (no path) when you want every callback pinned to one host. Leave it unset on Vercel if sign-in should stay on whichever domain the user opened (`llmarena-rafa1l` or `llmarena-coral`); register both callback URLs in that case.

Legacy Replit URLs (`/api/login`, `/api/callback`, `/api/logout`) still return `410 Gone`. Auth.js lives at `/api/auth/[...nextauth]`. `GET /api/auth/user` is this app's profile endpoint, not an Auth.js route.

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
| `DATABASE_URL` | Yes (runtime) | Supabase Postgres URI. Pooler URL with `sslmode=require` is fine |
| `STRIPE_SECRET_KEY` | For purchases | |
| `STRIPE_WEBHOOK_SECRET` | For purchases | From Stripe Dashboard → Webhooks |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | For purchases | Publishable key |
| `OPENAI_API_KEY` | Recommended | GPT-5.4 |
| `ANTHROPIC_API_KEY` | Recommended | Claude Sonnet 5 |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Recommended | Gemini 3.8 Flash (or `GOOGLE_API_KEY`) |
| `OPENROUTER_API_KEY` | Recommended | Grok 4.6 |
| `AUTH_SECRET` | For sign-in | Session JWT encryption |
| `AUTH_GOOGLE_ID` | For Google sign-in | OAuth client id |
| `AUTH_GOOGLE_SECRET` | For Google sign-in | OAuth client secret |
| `AUTH_GITHUB_ID` | For GitHub sign-in | OAuth client id |
| `AUTH_GITHUB_SECRET` | For GitHub sign-in | OAuth client secret |
| `AUTH_URL` | Optional | Canonical origin, no path. `NEXTAUTH_URL` is the v4 alias |

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

Point `DATABASE_URL` at a Supabase Postgres database (Project Settings → Database → connection string). The pooler URL is the right choice on Vercel. Run `npm run db:push` once if the schema is not already applied.

This is a normal Postgres connection through Drizzle and `pg`. The app does not use the Supabase JS client or Supabase Auth.

#### Database SSL

`pg` treats `sslmode=require` as full certificate verification. Supabase’s pooler certificate fails that check. Libpq’s `require` only encrypts the session.

For hosts ending in `.supabase.co` or `.supabase.com` (the direct host and the pooler), the app connects with `ssl: { rejectUnauthorized: false }` and Drizzle Kit receives the same URL with `sslmode=no-verify`. Paste the dashboard URI unchanged. Other Postgres hosts are left alone. If you want verification, set `sslmode=verify-full` or provide `sslrootcert`. You can also set `sslmode=no-verify` yourself. Never commit the password.

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
4. Buy credits (Stripe test mode). Gift via admin after signing in as a user with `is_admin = true`
5. Select 2+ models, run a compare, optionally enable Caesar and Maximus
6. Confirm battle history is only in the browser; dashboard shows timestamps + credits only

---

## License

MIT

---

## Version

v1.2
