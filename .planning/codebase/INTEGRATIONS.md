# External Integrations

**Analysis Date:** 2026-04-01

## APIs & External Services

**Social Media Platforms:**
- Meta Developer Platform - Instagram Business and Facebook Page API access.
  - SDK/Client: Meta Graph API (v19.0+) via `fetch`.
  - Auth: OAuth2 (Access Tokens stored in Supabase).
  - Webhooks: Configured for real-time engagement monitoring.

- LinkedIn API - Content publishing and professional profile integration.
  - SDK/Client: REST API via `lib/platforms/linkedin.ts`.
  - Auth: OAuth2 (Access Tokens).

- YouTube Data API - Video metadata and channel synchronization.
  - SDK/Client: REST API via `lib/platforms/youtube.ts`.

**Generative AI:**
- Google Gemini - Vision analysis and creative copy generation.
  - Integration: `@google/generative-ai` SDK.
  - Model: `gemini-1.5-pro` (Vision) and `gemini-3-pro` (Text).

- Groq - High-performance LPU inference for fast text tasks.
  - Integration: `groq-sdk`.
  - Model: `llama-3` or `mixtral`.

## Data Storage

**Databases:**
- PostgreSQL on Supabase - Primary relational data store.
  - Connection: via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Client: `@supabase/supabase-js`.
  - Migrations: Managed in `supabase/migrations`.

**File Storage:**
- Supabase Storage - Media assets, video uploads, and generated visuals.
  - SDK/Client: Supabase Storage SDK.
  - Buckets: `media`, `uploads`.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Native Next.js auth with social login capabilities.
  - Implementation: `@supabase/auth-helpers-nextjs` and `@supabase/ssr`.
  - Session Management: JWT cookies.

**OAuth Management:**
- Custom OAuth Handler - Centralized logic for multi-platform connections.
  - Code: `lib/platforms/oauth-handler.ts`.
  - Storage: Persistent tokens linked to user brand profiles.

## Monitoring & Observability

**Vercel Analytics:**
- Basic traffic and serverless function monitoring.
- Deployment Logs - Real-time monitoring of OAuth callbacks and agent execution.

## CI/CD & Deployment

**Hosting:**
- Vercel - Optimized for Next.js 16.
- Integration: GitHub repository triggers automated builds and deployments.

## Environment Configuration

**Production Credentials:**
- `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` - Meta integration keys.
- `GROQ_API_KEY`, `GOOGLE_AI_API_KEY` - AI provider keys.
- `NEXT_PUBLIC_APP_URL` - Production domain for OAuth redirects.

## Webhooks & Callbacks

**Incoming:**
- Meta Callbacks - `/api/oauth/instagram/callback` handling token exchange.

---

*Integration audit: 2026-04-01*
*Update when adding/removing external services*
