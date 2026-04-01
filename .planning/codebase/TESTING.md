# Testing Strategy

**Analysis Date:** 2026-04-01

## Current State

**Manual Verification:**
- Primary method for validating platform connections and AI pipeline runs.
- Visual verification via the Dashboard and Settings pages.
- Log monitoring on Vercel deployment dashboard.

**Automated Testing (Gaps):**
- No `tests/` directory or `vitest`/`jest` configurations detected in the root.
- Testing logic is currently inline within utility functions (logs/error handling).

## Recommended Patterns

**Unit Testing:**
- Scope: `lib/utils.ts`, `lib/brand/`, `lib/ai/` (logic without side effects).
- Tool: `Vitest`.

**Integration Testing:**
- Scope: `lib/platforms/oauth-handler.ts`, `lib/agents/publisher.ts`.
- Mocking: `msw` or `nock` for external platform APIs and Supabase responses.

**End-to-End (E2E) Testing:**
- Scope: Auth, Connections, Workflow triggers.
- Tool: `Playwright` or `Cypress`.

## CI/CD Integration

**GitHub Actions:**
- Potential for `eslint` and `type-check` on each pull request.

**Vercel Preview Deployments:**
- Automated preview links for each feature branch to enable visual UAT.

---

*Testing audit: 2026-04-01*
*Update as test coverage increases*
