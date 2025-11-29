# LLM Comparison Platform with Prepaid Credits

## Overview
This project is a privacy-first, pay-per-use LLM model comparison platform. It enables users to submit a single prompt and simultaneously view responses from multiple AI models (GPT-4o, Claude Sonnet 4, Gemini Flash, Grok). The platform operates in two modes: Guest Mode for anonymous use with secure tokens and credit purchases, and Authenticated Mode via Replit Auth for users who wish to preserve credits across devices. The core business model is pay-per-use with prepaid credits, not subscription-based, offering various credit packs. A unique feature includes the Caesar Judge, an AI-powered evaluation system for response comparison.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Privacy-First Architecture
The platform is designed with a core principle of zero data collection regarding user prompts and AI responses. Only minimal billing data (credit balances, Stripe customer IDs, usage transactions with timestamp and credits spent) is stored. Prompts, AI responses, model IDs, and conversation history are never stored. This is enforced through a specific database schema, API layer design, and type/runtime safety checks.

### Frontend Architecture
- **Framework**: React with TypeScript on Vite
- **UI/Styling**: Shadcn/ui (Radix UI primitives), Tailwind CSS, Inter font for UI, JetBrains Mono for code.
- **State Management**: React Query
- **Routing**: Wouter
- **Key Features**:
    - **Landing Page**: Entry point with privacy messaging and dual authentication options (Guest or Replit Auth).
    - **Home Page**: Main comparison interface.
    - **Dashboard**: Privacy-first statistics (credit balance, comparison count, credits spent, recent activity timestamps).
    - **Purchase Page**: Stripe integration for credit pack purchases.
    - **Comparison Tools**: ModelSelector, PromptInput with credit counter, ComparisonGrid, ComparisonCard (with copy, export, session-only rating, generation time, token count).
    - **CaesarCard**: Displays AI judge verdicts (winner, confidence, verdict, reasoning, score breakdown).
    - **Authentication Hooks**: `useAuth`, `useCreditBalance`, `useAccountLinking`.
    - **Session-Only Features**: Client-side export (JSON/Markdown) and 5-star rating system, not persisted to the database.
    - **Blind Mode**: Toggles model names to "Contender A/B" until revealed by user vote or Caesar verdict.
    - **Battle History**: Stores the last 10 battles locally (localStorage) for privacy, allowing users to reload previous comparisons.
    - **Download Report**: Client-side PDF/Markdown/JSON generation for full comparison reports including all responses and Caesar verdict.
    - **Admin Panel** (`/admin`): Admin-only page for managing users and guest tokens, including gifting credits. Only visible to users with `isAdmin: true`.

### Backend Architecture
- **Framework**: Express.js with TypeScript (ES modules, tsx for dev, esbuild for prod).
- **API Design**: RESTful, dual authentication, privacy-first logging.
- **Authentication**: Replit Auth (`/api/login`, `/api/callback`, `/api/logout`, `/api/auth/user`) and Guest Token system (`/api/guest/create`, `/api/guest/verify`, `/api/link-guest-account`).
- **Comparison Endpoint (`POST /api/compare`)**: Processes comparisons, deducts credits, logs minimal data (`userId/guestTokenId`, `creditsCost`), and never stores prompts/responses. Includes optional Caesar Judge integration.
- **Dashboard Endpoint (`GET /api/dashboard/stats`)**: Provides aggregate user statistics without exposing sensitive data.
- **Stripe Endpoints**: `create-checkout-session`, `stripe-webhook`.
- **Admin Endpoints**: 
    - `GET /api/admin/users?search=` - List all users with optional search.
    - `GET /api/admin/guest-tokens?search=` - List all guest tokens with optional search.
    - `POST /api/admin/gift-credits` - Gift credits to a user or guest token. Requires `isAdmin: true`.
- **LLM Integration**: Orchestrates OpenAI, Anthropic, Google GenAI, and OpenRouter SDKs via Replit AI Integrations for GPT-4o, Claude Sonnet 4, Gemini Flash, and Grok.

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL (Neon via `@neondatabase/serverless`).
- **Database Tables**:
    - `sessions`: Replit Auth session storage.
    - `users`: User accounts (email, name, creditBalance, stripeCustomerId, isAdmin).
    - `guestTokens`: Anonymous tokens (token, creditBalance).
    - `usageHistory`: **Minimal logging** of `id`, `userId`, `guestTokenId`, `timestamp`, `creditsCost`. **Does NOT store prompts, responses, or model IDs.**
    - `processedWebhookEvents`: Stripe webhook idempotency tracking.
- **Storage Interface**: Centralized functions for user, guest token, and usage tracking operations, ensuring privacy-first logging.

## External Dependencies

### AI Model Providers
- OpenAI
- Anthropic
- Google Gemini
- OpenRouter (for Grok)
- All integrated via Replit AI Integrations for API key management.

### Database
- Neon PostgreSQL

### Payment Processing
- Stripe for credit purchases (configured for live mode with webhooks).

### UI Components
- Radix UI primitives
- Shadcn/ui component library
- Lucide React icons