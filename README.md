# LLM ARENA

**Privacy-first AI model comparison platform. Compare GPT-4o, Claude, Gemini & Grok side-by-side. AI judge evaluates winners. Pay-per-use credits, no subscriptions.**

---

## Overview

Arena AI lets you submit a single prompt and instantly compare responses from the world's leading AI models. See how GPT-4o, Claude Sonnet 4, Gemini Flash, and Grok tackle the same challenge — all in one view.

### Why Arena AI?

- **Save Time**: No more switching between ChatGPT, Claude, and Gemini tabs
- **Privacy First**: We never store your prompts or AI responses
- **Pay What You Use**: No monthly subscriptions, just prepaid credits
- **Unbiased Comparison**: Blind Mode hides model names until you vote

---

## Features

### Model Comparison
Submit one prompt, get responses from up to 4 AI models simultaneously:
- **GPT-4o** (OpenAI)
- **Claude Sonnet 4** (Anthropic)
- **Gemini Flash** (Google)
- **Grok** (xAI)

### Caesar Judge
An AI-powered evaluation system that analyzes all responses and declares a winner based on:
- Accuracy
- Clarity
- Creativity
- Safety

Caesar provides a confidence score, detailed reasoning, and score breakdown for each model.

### Maximus
The ultimate synthesizer. Maximus reads all model responses and forges the best possible answer by combining the strongest insights from each.

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
- OpenAI (GPT-4o)
- Anthropic (Claude Sonnet 4)
- Google GenAI (Gemini Flash)
- OpenRouter (Grok)

### Payments
- Stripe

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- API keys for AI providers

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
OPENROUTER_API_KEY=sk-or-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Replit Auth (optional)
REPLIT_DOMAINS=...
ISSUER_URL=...
```

### Installation

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`

---

## Authentication

Arena AI supports two authentication modes:

1. **Guest Mode**: Anonymous usage with a secure token. Credits are tied to your browser.
2. **Replit Auth**: Sign in to preserve credits across devices and sessions.

Guest accounts can be linked to authenticated accounts to transfer credits.

---

## Admin Panel

Admins can access `/admin` to:
- View and search all users
- View and search guest tokens
- Gift credits to users or guests

---

## License

MIT

---

## Version

v1.1
