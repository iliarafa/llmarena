# LLM Comparison Platform with Prepaid Credits

## Overview

This is a **privacy-first**, pay-per-use LLM model comparison platform that allows users to submit a single prompt and view side-by-side responses from multiple AI models (GPT-4o, Claude Sonnet 4, Gemini Flash, and Grok). The application supports two modes:
- **Guest Mode**: Anonymous users can create a secure token and buy credits without signing up
- **Authenticated Mode**: Users can create an account via Replit Auth to preserve credits across devices

**Status**: ✅ **Production Ready - All Features Complete**
- ✅ All 4 LLM providers integrated and working
- ✅ Landing page with privacy messaging and dual auth options
- ✅ Guest token system for anonymous usage
- ✅ Replit Auth integration for optional accounts
- ✅ Dual authentication middleware (guest tokens + user sessions)
- ✅ PostgreSQL database with minimal privacy-first schema
- ✅ Stripe payment integration (live keys configured)
- ✅ Credit deduction system and purchase UI
- ✅ Session-based export and rating features
- ✅ Privacy-first dashboard (no prompt/response storage)
- ✅ Caesar Judge feature for AI-powered response evaluation

## User Preferences

Preferred communication style: Simple, everyday language.

## Privacy-First Architecture

**Core Privacy Principle**: Zero data collection of user prompts and AI responses.

### What We Store (Minimal Billing Data Only)
- **User/Guest Accounts**: Credit balances, Stripe customer IDs
- **Usage Transactions**: Timestamp and credits spent per comparison
- **Session Data**: Temporary authentication sessions

### What We Never Store
- ❌ User prompts
- ❌ AI model responses
- ❌ Model IDs used in comparisons
- ❌ Any conversation history

### Privacy Verification
- **Database Schema**: `usageHistory` table contains only `id`, `userId`, `guestTokenId`, `timestamp`, `creditsCost`
- **API Layer**: Comparison endpoint explicitly excludes prompts from database logging
- **Type Safety**: Drizzle ORM's `InsertUsageHistory` schema rejects extraneous fields at compile time
- **Runtime Safety**: Zod's strip behavior removes unknown keys, Drizzle ignores extra properties

## Business Model

**Pay-per-use with prepaid credits** (not subscription-based):
- Users buy credit packs via Stripe:
  - Starter: $2.50 for 20 credits
  - Popular: $10 for 100 credits
  - Pro: $40 for 500 credits
  - Ultimate: $70 for 1000 credits
- Each comparison costs: 3 credits (1 model), 5 credits (2 models), 7 credits (3 models), or 10 credits (4 models)
- Caesar Judge adds +3 credits when enabled
- No monthly fees or commitments
- Credits never expire
- Guest users can optionally convert to accounts to preserve credits

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript running on Vite
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system using CSS variables
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Typography**: Inter for UI text, JetBrains Mono for code snippets

**Design Philosophy**: System-based approach emphasizing clarity and efficiency. Clean, minimal visual noise to let content take center stage. The design follows a neutral color scheme with carefully defined spacing primitives.

**Key Pages & Components**:
- **Landing Page** (`client/src/pages/landing.tsx`): Entry point with privacy messaging and two auth options
  - "Try as Guest" - Creates anonymous token, stores in localStorage
  - "Sign In with Replit" - Redirects to `/api/login` for account creation
  - Privacy guarantee badge: "Your prompts and responses are never stored or logged"
  - Large LLM Arena title (text-6xl) with robot fighting image
- **Home Page** (`client/src/pages/home.tsx`): Main comparison interface with user menu
- **Dashboard Page** (`client/src/pages/dashboard.tsx`): Privacy-first stats showing:
  - Current credit balance
  - Total comparisons count
  - Total credits spent
  - Recent activity (timestamps and credit amounts only)
- **Purchase Page** (`client/src/pages/purchase.tsx`): Stripe checkout for credit packs
- **ModelSelector**: Checkbox-based UI for selecting 1-4 models
- **PromptInput**: Large textarea with permanent credit counter
- **ComparisonGrid**: Responsive grid layout adapting to 1-4 models
- **ComparisonCard**: Response cards with:
  - Copy to clipboard button
  - Export dropdown (JSON/Markdown) - session-only, client-side downloads
  - Session-only 5-star rating system (not persisted)
  - Generation time and token count display
- **CaesarCard** (`client/src/components/CaesarCard.tsx`): AI judge verdict display
  - Winner badge with model name
  - Confidence meter (0-100%)
  - One-line verdict summary
  - Detailed reasoning bullets
  - Score breakdown per model (accuracy, clarity, creativity, safety, overall)
  - Amber themed styling to distinguish from model responses

**Authentication Hooks**:
- **useAuth** (`client/src/hooks/useAuth.ts`): Check authentication status
- **useCreditBalance** (`client/src/hooks/useCreditBalance.ts`): Real-time credit balance
- **useAccountLinking** (`client/src/hooks/useAccountLinking.ts`): Transfer guest credits to user account

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Module System**: ES modules (type: "module")
- **Development**: tsx for hot-reloading
- **Production**: esbuild for bundling

**API Design**: RESTful API with dual authentication and privacy-first logging

**Authentication Endpoints** (via Replit Auth):
- `GET /api/login`: Initiates Replit Auth (Google, Apple, GitHub, email)
- `GET /api/callback`: OAuth callback
- `GET /api/logout`: Clears session
- `GET /api/auth/user`: Returns current user (protected)

**Guest Token Endpoints**:
- `POST /api/guest/create`: Creates anonymous token with 0 credits
- `POST /api/guest/verify`: Validates guest token
- `POST /api/link-guest-account`: Transfers guest credits to user account

**Comparison Endpoint**:
- `POST /api/compare`: Processes comparison, deducts credits
  - **Privacy Implementation**: Logs only `userId/guestTokenId` and `creditsCost` to database
  - Returns responses to client but never stores prompts/responses
  - Protected by dual auth middleware (guest token OR user session)
  - **Caesar Judge** (optional): When `caesarEnabled=true`, calls judge model after responses
    - Request: `{ prompt, modelIds, caesarEnabled, caesarJudgeModel }`
    - Response includes `caesar: { verdict, generationTime, judgeModel, modelMapping }`
    - Judge models: claude-3-5-sonnet (default), gpt-4o, gemini-flash, grok
    - Responses anonymized as A/B/C/D in judge prompt for unbiased evaluation

**Dashboard Endpoint**:
- `GET /api/dashboard/stats`: Returns aggregate statistics (no prompts/responses)
  - Total comparisons count
  - Total credits spent
  - Recent activity (timestamps and credit amounts)

**Stripe Endpoints**:
- `POST /api/create-checkout-session`: Creates Stripe checkout
- `POST /api/stripe-webhook`: Handles payment confirmation with idempotency

**Authentication Middleware** (`server/authMiddleware.ts`):
- `requireAuth`: Accepts Bearer tokens (guests) or session cookies (users)
- Helper functions: `getCreditBalance()`, `getAuthId()`, `updateCreditBalance()`

**LLM Integration**: Multiple AI provider SDKs orchestrated in parallel
- OpenAI SDK for GPT-4o
- Anthropic SDK for Claude Sonnet 4
- Google GenAI SDK for Gemini Flash
- OpenRouter for Grok

All LLM clients use Replit AI Integrations for abstracted API key management.

### Data Storage

**ORM**: Drizzle ORM with PostgreSQL
- Schema: `shared/schema.ts` for type safety
- Migrations: `npm run db:push` (never manual SQL)

**Database Tables** (Privacy-First Schema):
- **sessions**: Replit Auth session storage
- **users**: User accounts (email, name, creditBalance, stripeCustomerId)
- **guestTokens**: Anonymous tokens (token, creditBalance)
- **usageHistory**: **MINIMAL LOGGING ONLY**
  - Fields: `id`, `userId`, `guestTokenId`, `timestamp`, `creditsCost`
  - **Does NOT store**: prompts, responses, model IDs
- **processedWebhookEvents**: Stripe webhook idempotency tracking

**Storage Interface** (`server/storage.ts`):
- User operations: `getUser()`, `upsertUser()`, `updateUserCredits()`
- Guest token operations: `createGuestToken()`, `getGuestTokenByToken()`, `updateGuestTokenCredits()`
- Usage tracking: `logComparison()` (minimal data only), `getUserUsageHistory()`, `getGuestUsageHistory()`

### Session-Only Features (No Persistence)

**Export Functionality** (`ComparisonCard.tsx`):
- Download individual responses as JSON or Markdown
- Includes prompt, response, metadata, and rating
- Client-side only - no server storage
- Lost when page is closed/refreshed

**Rating System** (`ComparisonCard.tsx`):
- 5-star rating per model response
- Stored in React component state
- Helps users compare during current session
- Never persisted to database

### Build & Development

**Monorepo Structure**:
- `/client`: Frontend React application
- `/server`: Express backend
- `/shared`: Shared TypeScript types and schemas
- `/attached_assets`: Static assets like model logos

**Path Aliases**:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

**Development Workflow**:
- `npm run dev`: Development server (Vite + Express)
- `npm run build`: Production build
- `npm run start`: Production server
- `npm run db:push`: Sync database schema

## External Dependencies

### AI Model Providers
- OpenAI, Anthropic, Google Gemini, OpenRouter via Replit AI Integrations
- Credits-based billing instead of direct API costs

### Database
- Neon PostgreSQL via `@neondatabase/serverless`

### Payment Processing
- Stripe for credit purchases
- Live mode configured with webhook support

### UI Components
- Radix UI primitives (Dialog, Dropdown, Popover, etc.)
- Shadcn/ui component library
- Lucide React icons

## Environment Variables (All Configured)
- `STRIPE_SECRET_KEY` - Live Stripe secret key
- `VITE_STRIPE_PUBLIC_KEY` - Live Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `DATABASE_URL` - PostgreSQL connection
- `SESSION_SECRET` - Session encryption

## Recent Changes

### Blind Mode Feature (Nov 29, 2025)
1. **Blind Mode Toggle** (`client/src/components/ModelSelector.tsx`):
   - Toggle with EyeOff icon and purple styling when enabled
   - Shows "Contender A", "Contender B", etc. instead of model names
   - Reveals real identities after user votes or Caesar decides

2. **Voting System** (`client/src/components/ComparisonCard.tsx`):
   - Vote button appears in blind mode (thumbs up icon)
   - Clicking Vote reveals all model identities
   - Star ratings hidden during blind mode, shown after reveal

3. **Auto-Reveal Logic** (`client/src/pages/home.tsx`):
   - Blind mode resets when starting new comparison
   - Auto-reveals when Caesar verdict arrives
   - Toast notification confirms vote and reveal

### Caesar Judge Feature (Nov 29, 2025)
1. **Caesar Prompt Template** (`server/prompts/caesarPrompt.ts`):
   - Anonymizes models as "Response A/B/C/D" to prevent bias
   - Returns structured JSON: winner, confidence, one_line_verdict, detailed_reasoning, scores
   - Helper function `buildCaesarPrompt()` constructs prompt with internal model mapping

2. **ModelSelector Caesar Toggle** (`client/src/components/ModelSelector.tsx`):
   - Separate toggle card with gavel icon below model selection
   - Amber border styling when enabled
   - Judge model dropdown: Claude 3.5 Sonnet (default), GPT-4o, Gemini Flash, Grok
   - Shows "(+3 credits)" label

3. **LLM Module Extension** (`server/llm.ts`):
   - New `generateCaesarVerdict()` function
   - Supports all 4 judge models via their respective SDKs
   - JSON parsing with markdown code block handling

4. **CaesarCard Component** (`client/src/components/CaesarCard.tsx`):
   - Winner badge with actual model name (mapped from A/B/C/D)
   - Confidence meter with percentage display
   - One-line verdict in highlighted box
   - Detailed reasoning bullets
   - Score breakdown grid (accuracy, clarity, creativity, safety, overall)
   - Loading and error states with amber theming

5. **Credit System Update**:
   - Base cost (3/5/7/10 for 1/2/3/4 models) + 3 credits when Caesar enabled
   - Dynamic credit display updates in PromptInput component

### Privacy-First Implementation (Nov 16, 2025)
1. **Database Schema Updated**:
   - Removed `prompt` and `modelIds` fields from `usageHistory` table
   - Only stores timestamp and credits spent for billing purposes
   
2. **API Layer Protected**:
   - Comparison endpoint explicitly excludes prompts from logging
   - Dashboard endpoint returns only aggregate stats (counts, totals)
   
3. **Usage History Removed**:
   - Deleted usage history page (no meaningful data to display)
   - Replaced with privacy-first dashboard showing minimal stats
   
4. **New Features Added**:
   - Session-based export (JSON/Markdown downloads)
   - Session-only 5-star rating system
   - Privacy-first dashboard with aggregate statistics
   
5. **Landing Page Updates**:
   - Large LLM Arena title (text-6xl)
   - Green privacy guarantee badge
   - Robot fighting image centered above feature cards

## Design Philosophy

- **Privacy First**: Zero data collection messaging throughout
- **Minimal Interface**: Clean, system-based design with neutral colors
- **Accessibility**: ARIA compliant, keyboard navigable
- **Responsive**: Mobile-first design adapting to all screen sizes

## Footer
- v 1.0
- This Whole World LLC - November 2025
