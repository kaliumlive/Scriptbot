# Technical Concerns & Debt

**Analysis Date:** 2026-04-01

## Identified Debt

**1. Infrastructure Region Mismatch:**
- Previously, Vercel was in `us-east-1` while Supabase was in `ap-south-1` (Mumbai).
- **Status:** Resolved (Migration of Vercel to `ap-south-1`).
- **Risk:** Latency spikes if not monitored.

**2. Supabase Resilience:**
- Supabase client initialization lacks robust retry logic.
- **Status:** Mitigation (Added 10s `AbortSignal` timeout to fetch in `lib/supabase/server.ts`).
- **Risk:** Failure on intermittent network instability during OAuth callbacks.

**3. Test Coverage:**
- Absence of automated testing framework.
- **Status:** Current process is manual and visual.
- **Risk:** Regressions in social media integration or AI pipeline updates.

**4. External Icon Stability:**
- `lucide-react` imports occasionally fail due to dynamic loading or runtime errors.
- **Status:** Mitigation (Replaced critical path icons with custom SVG components in `repurpose/page.tsx`).
- **Risk:** Visual breakage in future UI updates.

**5. OAuth Token Security:**
- Primary tokens and refresh tokens stored in `Platform Connections` table.
- **Status:** Expected standard RLS in Supabase.
- **Risk:** Broad data access if RLS is misconfigured.

## Fragile Areas

**1. Video Processing:**
- `@ffmpeg/ffmpeg` and `puppeteer-core` are resource-intensive for serverless environments.
- **Risk:** Execution timeout on long videos or complex carousel generation.

**2. Meta API Permissions:**
- Application requires specific scopes like `instagram_content_publish`.
- **Risk:** Permissions may expire or require periodic user re-authentication.

## Performance Bottlenecks

**1. Cold Starts:**
- Next.js serverless functions may experience cold starts on initial OAuth callback triggers.

**2. Concurrent Processing:**
- High traffic to the AI pipeline (`lib/agents/pipeline.ts`) may challenge Vercel's concurrency limits.

---

*Concerns audit: 2026-04-01*
*Update as issues are documented or resolved*
