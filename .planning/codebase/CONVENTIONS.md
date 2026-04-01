# Coding Conventions

**Analysis Date:** 2026-04-01

## Standard Practices

**Language:**
- TypeScript is mandatory for all new logic.
- `any` is strictly avoided; use zod-inferred types or manual interfaces.

**Framework:**
- Next.js App Router patterns (Server Components by default).
- `"use client"` directive used only when interactive hooks (useState, useEffect) are required.

**UI:**
- Tailwind CSS 4 utility classes for all styling.
- Radix UI accessibility standards for complex interactive elements.
- Custom SVG components for critical icons to ensure cross-browser stability.

## Code Style

**Naming:**
- Files: `kebab-case.ts` for logic, `PascalCase.tsx` for components.
- Interfaces/Types: `PascalCase`.
- Variables/Functions: `camelCase`.

**Organization:**
- Imports ordered by: External, Local `lib/`, Local `components/`, Types, Styles.
- Early returns favored for error handling.
- Large components split into sub-files within a feature directory.

## Error Handling

**General:**
- Try/catch blocks used in all async operations.
- User-facing errors displayed via `sonner` toasts.

**OAuth:**
- Detailed logging for redirect/callback failures.
- Fallback mechanisms for database persistence during token exchange (`lib/platforms/oauth-handler.ts`).

## Data Pattern

**Supabase:**
- Client-side data fetching minimized; Server Actions and Server Components prioritized.
- Row-Level Security (RLS) expected for all data tables.

**Validation:**
- `zod` schemas used for all API route inputs.

---

*Convention analysis: 2026-04-01*
*Update as project standards evolve*
