# LLM Comparison Platform with Prepaid Credits

## Overview

This is a pay-per-use LLM model comparison platform that allows users to submit a single prompt and view side-by-side responses from multiple AI models (GPT-4o, Claude Sonnet 4, Gemini Flash, and Grok). The application supports two modes:
- **Guest Mode**: Anonymous users can create a secure token and buy credits without signing up
- **Authenticated Mode**: Users can create an account via Replit Auth to preserve credits across devices

**Status**: 🚧 In Development - Core Features Complete
- ✅ All 4 LLM providers integrated and working
- ✅ Landing page with guest and sign-in options
- ✅ Guest token system for anonymous usage
- ✅ Replit Auth integration for optional accounts
- ✅ Dual authentication middleware (guest tokens + user sessions)
- ✅ PostgreSQL database schema for users, guest tokens, and usage tracking
- ⏳ Stripe payment integration (pending API keys from user)
- ⏳ Credit deduction system
- ⏳ Credit purchase UI
- ⏳ Usage history and account linking

## User Preferences

Preferred communication style: Simple, everyday language.

## Business Model

**Pay-per-use with prepaid credits** (not subscription-based):
- Users buy credit packs via Stripe (e.g., 100 credits for $10)
- Each comparison deducts credits based on models selected
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

**Design Philosophy**: System-based approach emphasizing clarity and efficiency. Clean, minimal visual noise to let content take center stage. The design follows a neutral color scheme with carefully defined spacing primitives (2, 4, 6, 8, 16, 24 Tailwind units).

**Key Pages & Components**:
- **Landing Page** (`client/src/pages/landing.tsx`): Entry point with two options:
  - "Try as Guest" - Creates anonymous token, stores in localStorage
  - "Sign In with Replit" - Redirects to `/api/login` for account creation
- **Home Page** (`client/src/pages/home.tsx`): Main comparison interface with:
  - User menu showing authentication status (guest vs logged-in)
  - Logout/clear token functionality
- **ModelSelector**: Checkbox-based UI for selecting 1-4 models to compare
- **PromptInput**: Large textarea with character counter and keyboard shortcuts (Cmd/Ctrl+Enter to submit)
- **ComparisonGrid**: Responsive grid layout that adapts based on number of selected models (1-4)
- **ComparisonCard**: Individual cards showing model responses with metadata (generation time, token count), copy functionality, and error states

**Authentication Hooks**:
- **useAuth** (`client/src/hooks/useAuth.ts`): React hook for checking authentication status
  - Returns `{ user, isLoading, isAuthenticated }`
  - Queries `/api/auth/user` endpoint
  - Used throughout the app to show/hide content based on auth state

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Module System**: ES modules (type: "module")
- **Development**: tsx for hot-reloading during development
- **Production**: esbuild for bundling server code

**API Design**: RESTful API with authentication and payment support

**Authentication Endpoints** (via Replit Auth):
- `GET /api/login`: Initiates Replit Auth login flow (Google, GitHub, email/password)
- `GET /api/callback`: OAuth callback handler
- `GET /api/logout`: Logs out user and clears session
- `GET /api/auth/user`: Returns current authenticated user (protected route)

**Guest Token Endpoints**:
- `POST /api/guest/create`: Creates anonymous guest token with 0 credits

**Comparison Endpoint**:
- `POST /api/compare`: Accepts prompt and array of model IDs, returns parallel responses
  - Protected by dual authentication middleware (guest token OR user session)
  - Request validation using Zod schemas
  - Error handling with appropriate HTTP status codes

**Authentication Middleware** (`server/authMiddleware.ts`):
- `requireAuth`: Accepts both Bearer tokens (guests) and session cookies (logged-in users)
- Populates `req.guestToken` or `req.authenticatedUser` based on auth method
- Helper functions: `getCreditBalance()`, `getAuthId()`, `updateCreditBalance()`

**LLM Integration**: Multiple AI provider SDKs orchestrated in parallel
- OpenAI SDK for GPT-4o
- Anthropic SDK for Claude Sonnet
- Google GenAI SDK for Gemini Flash
- OpenRouter (via OpenAI SDK) for Grok access

All LLM clients are configured to use Replit AI Integrations, which abstract away API key management and bill usage to Replit credits rather than requiring individual API keys.

**Response Processing**: Each model request includes timing information and token counts, with graceful error handling that allows partial success (some models can succeed while others fail).

### Data Storage

**ORM**: Drizzle ORM with PostgreSQL dialect
- Schema defined in `shared/schema.ts` for type safety across client/server
- Database instance exported from `server/db.ts`
- Migration support via drizzle-kit (`npm run db:push`)

**Database Tables** (`shared/schema.ts`):
- **sessions**: Session storage for Replit Auth (required for authentication)
- **users**: User accounts with Replit Auth fields (id, email, firstName, lastName, profileImageUrl) plus credit balance and Stripe customer ID
- **guestTokens**: Anonymous guest tokens with credit balances for users without accounts
- **usageHistory**: Tracks all comparisons with model IDs, credit cost, prompt, and timestamp

**Storage Interface** (`server/storage.ts`):
- User operations: `getUser()`, `getUserByEmail()`, `upsertUser()`, `updateUserCredits()`
- Guest token operations: `createGuestToken()`, `getGuestTokenByToken()`, `updateGuestTokenCredits()`, `updateGuestTokenLastUsed()`
- Usage tracking: `logComparison()`, `getUserUsageHistory()`, `getGuestUsageHistory()`

**Session Management**: PostgreSQL-backed sessions via `connect-pg-simple` for Replit Auth

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
- `npm run dev`: Runs development server with Vite middleware integrated into Express
- `npm run build`: Builds both frontend (Vite) and backend (esbuild)
- `npm run start`: Production server
- `npm run db:push`: Push schema changes to database

**Vite Configuration**: Custom setup with React plugin, runtime error overlay, and Replit-specific plugins (cartographer, dev-banner) in development mode.

## External Dependencies

### AI Model Providers

**Replit AI Integrations**: All AI models accessed through Replit's unified integration layer
- Configured via environment variables (base URLs and API keys)
- Supports OpenAI, Anthropic, Google Gemini, and OpenRouter
- Credits-based billing instead of direct API costs

### Database

**Neon PostgreSQL**: Serverless PostgreSQL via `@neondatabase/serverless`
- Connection string via `DATABASE_URL` environment variable
- WebSocket-based connection for serverless compatibility

### UI Component Libraries

**Radix UI**: Complete set of unstyled, accessible primitives
- Dialog, Dropdown Menu, Popover, Toast, Tooltip, and 20+ other components
- Fully keyboard navigable and ARIA compliant

**Additional UI Dependencies**:
- `cmdk`: Command menu component
- `react-day-picker`: Calendar/date picker
- `embla-carousel-react`: Carousel component
- `vaul`: Drawer component
- `recharts`: Charting library (configured but not actively used)

### Styling & Utilities

- **Tailwind CSS**: Utility-first styling with custom configuration
- **class-variance-authority**: Type-safe variant handling for components
- **clsx** and **tailwind-merge**: Class name composition utilities

### Form Handling

- **react-hook-form**: Form state management
- **@hookform/resolvers**: Validation resolver integration
- **zod**: Schema validation for both forms and API requests