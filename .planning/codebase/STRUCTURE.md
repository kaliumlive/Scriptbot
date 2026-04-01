# Directory Structure

**Analysis Date:** 2026-04-01

## Root Layout

- `.agent` - GSD (Get Shit Done) skill definitions and automation scripts.
- `.claude` - Claude-specific project settings.
- `.github` - CI/CD workflows (GitHub Actions).
- `.next` - Build artifacts (gitignored).
- `.planning` - **Project state and codebase mapping docs (Current location).**
- `app` - Next.js App Router (Pages, Layouts, API Routes).
- `components` - React components (UI kits, Feature-specific logic).
- `hooks` - Custom React hooks for platform-wide logic.
- `lib` - Core business logic, third-party SDK wrappers, and utility functions.
- `public` - Static assets (logos, fallback images).
- `scripts` - Migration helpers and CLI tools.
- `supabase` - Database configuration and migrations.
- `types` - Global TypeScript definitions.

## Key Subdirectories

### 1. `app/` (The Routing Engine)
- `(auth)/` - Login, Signup, and Password recovery routes.
- `(dashboard)/` - **Primary entry points for users.**
  - `repurpose/` - Video-to-carousel workflow.
  - `settings/` - Profile and Platform connection management.
  - `pipeline/` - Agentic automation dashboard.
- `api/` - **Stateless endpoints.**
  - `oauth/` - Social media token exchange handlers.

### 2. `lib/` (The Business Logic)
- `agents/` - **The AI Pipeline.**
  - `pipeline.ts` - Orchestrator.
  - `publisher.ts` - Posting logic.
  - `content-writer.ts` - LLM prompt logic.
  - `video-repurposer.ts` - Frame extraction and processing.
- `platforms/` - **External Systems.**
  - `instagram.ts`, `linkedin.ts`, `youtube.ts` - API methods.
  - `oauth-handler.ts` - Unified token management.
- `supabase/` - **Persistence.**
  - `server.ts` - Server-side client initialization.
  - `client.ts` - Browser-safe client.

### 3. `components/` (The View)
- `dashboard/` - High-level layouts for the app interface.
- `ui/` - **Atomic components from Shadcn/UI.**
- `brand/` - Brand-specific customization UI.

## File Naming Conventions

- **Pages/Routes:** `page.tsx`, `layout.tsx`, `route.ts`.
- **UI Components:** PascalCase (`Button.tsx`, `Input.tsx`).
- **Logic/Utilities:** camelCase (`utils.ts`, `oauth-handler.ts`).
- **Types:** `types.ts` or `.d.ts`.

---

*Structure analysis: 2026-04-01*
*Update after major directory reorganization*
