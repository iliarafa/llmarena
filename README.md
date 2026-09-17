# LLM ARENA

**Privacy-first AI model comparison platform. Compare GPT-5.4, Claude Sonnet 5, Gemini 3.8 Flash & Grok 4.6 side-by-side. AI judge evaluates winners. Pay-per-use credits, no subscriptions.**

Replit is **not required**. This is a normal Express + Vite app. Use your own API keys.

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

Tiers are defined once in `shared/models.ts` and used by both the Express compare route and the home page.

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

---

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui (Radix UI)
- TanStack Query
- Wouter (routing)

### Backend
- Express.js + TypeScript
- Drizzle ORM
- PostgreSQL (Neon)

### AI Providers
- OpenAI (GPT-5.4)
- Anthropic (Claude Sonnet 5)
- Google GenAI (Gemini 3.8 Flash)
- OpenRouter (Grok 4.6)

### Payments
- Stripe

---

## Getting Started

Replit is not required to build or run this app. Any Node 18+ host works (local, Railway, Fly, a VPS, etc.).

### Prerequisites
- Node.js 18+
- A Neon (or other Postgres) `DATABASE_URL`
- Provider keys for the models you want to call
- Stripe keys if you want credit purchases

### Environment Variables

Copy `.env.example` to `.env` and fill in values. **Never commit secrets.**

**Required to boot**
- `DATABASE_URL` — Neon/Postgres connection string. The server throws at import if this is missing (guest tokens live in the DB).

**Optional at boot (recommended for a full compare)**
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY` (or `GOOGLE_API_KEY`)
- `OPENROUTER_API_KEY`

Missing AI keys do not crash the process. Compare still returns; that model’s card shows an error.

**Stripe (required only for purchases / webhooks)**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VITE_STRIPE_PUBLIC_KEY`

The server boots without Stripe. Checkout fails with a clear error until `STRIPE_SECRET_KEY` is set.

**Other**
- `PORT` — defaults to `5000`

Replit Auth / AI Integrations env vars (`REPLIT_DOMAINS`, `REPL_ID`, `ISSUER_URL`, `AI_INTEGRATIONS_*`) are unused.

### Installation

```bash
cp .env.example .env
# edit .env with your keys

npm install

# Push database schema (needs DATABASE_URL)
npm run db:push

# Dev server (API + Vite client)
npm run dev
```

The app will be available at `http://localhost:5000`.

```bash
# Typecheck
npm run check

# Production build
npm run build
npm start
```

---

## Authentication

Guest tokens are the **primary and only** path right now.

1. **Guest Mode**: Create a token on the landing page. Credits are tied to that token in the database and stored in `localStorage` in this browser.
2. **Signed-in accounts**: Removed. Replit Auth (OIDC login, sessions, `/api/login`) is gone. Old login URLs return `410 Gone`. Account linking is unavailable. A future auth provider can be added later — do not wire callers back to Replit.

The `/admin` UI previously required a Replit session. It now shows access denied until a new account provider exists. Guest compare, credits, and Stripe checkout still work.

---

## Admin Panel

`/admin` is retained in the codebase but is not reachable without authenticated admin users. Guest tokens are the supported path for this revive.

---

## License

MIT

---

## Version

v1.2
