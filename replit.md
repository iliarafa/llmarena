# LLM Debate Comparison Platform

## Overview

This is a fully functional LLM model comparison platform that allows users to submit a single prompt and view side-by-side responses from multiple AI models (GPT-4o, Claude Sonnet 4.5, Gemini 2.5 Flash, and Grok 4 Fast). The application provides a clean, functional interface inspired by modern productivity tools for comparing lengthy text outputs efficiently.

**Status**: ✅ Complete and operational
- All 4 LLM providers are integrated and working
- End-to-end tested with successful responses from all models
- Proper error handling for individual model failures
- Responsive UI with loading states and copy functionality

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript running on Vite
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system using CSS variables
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Typography**: Inter for UI text, JetBrains Mono for code snippets

**Design Philosophy**: System-based approach emphasizing clarity and efficiency. Clean, minimal visual noise to let content take center stage. The design follows a neutral color scheme with carefully defined spacing primitives (2, 4, 6, 8, 16, 24 Tailwind units).

**Key Components**:
- **ModelSelector**: Checkbox-based UI for selecting 1-4 models to compare
- **PromptInput**: Large textarea with character counter and keyboard shortcuts (Cmd/Ctrl+Enter to submit)
- **ComparisonGrid**: Responsive grid layout that adapts based on number of selected models (1-4)
- **ComparisonCard**: Individual cards showing model responses with metadata (generation time, token count), copy functionality, and error states

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Module System**: ES modules (type: "module")
- **Development**: tsx for hot-reloading during development
- **Production**: esbuild for bundling server code

**API Design**: Simple REST API with a single comparison endpoint
- `POST /api/compare`: Accepts prompt and array of model IDs, returns parallel responses from selected models
- Request validation using Zod schemas
- Error handling with appropriate HTTP status codes

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
- User table structure in place for future authentication features
- Migration support via drizzle-kit

**Current State**: This application operates statelessly - comparisons are not persisted. Each request to `/api/compare` generates fresh responses from the selected LLM providers. No database storage is used for comparison results as this is a single-session tool.

**Session Management**: Not required for this application.

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