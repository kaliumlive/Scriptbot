# System Architecture

**Analysis Date:** 2026-04-01

## Patterns & Principles

**Framework:**
- Next.js 16 (App Router) - Server-centric model with hydrated client islands.

**Data Flow:**
- React (Client) -> Next.js Server Actions/API Routes -> Supabase (PostgreSQL).
- Server-side sessions (Cookies) using `@supabase/ssr`.

**Service Layer:**
- Platform-specific logic decoupled in `lib/platforms`.
- AI agentic logic centralized in `lib/agents`.

## Key Layers

**1. Presentation Layer (UI):**
- Standardized Shadcn/UI components (`components/ui`).
- Dashboard-specific layouts and components (`components/dashboard`).

**2. Application Layer (Next.js Routes):**
- `app/(dashboard)` - Protected routes for core feature interaction.
- `app/api/oauth` - Stateless callback handlers.

**3. Business Logic (Agents & Platforms):**
- `lib/agents` - Orchestrates high-level tasks like "Research trends" or "Full pipeline run."
- `lib/platforms` - Handles OAuth tokens, API calls, and platform-specific data transformations.

**4. Data Access Layer (Supabase):**
- Typed access using `supabase-js`.
- Server-side singleton initialization in `lib/supabase/server.ts`.

## Data Model (Summary)

**Core Entities:**
- `Brands` - Identity and preferences for a specific content creator.
- `Platform Connections` - OAuth tokens and metadata for linked accounts (Instagram, LinkedIn).
- `Drafts` - Staging area for AI-generated content before approval.
- `Posts` - History and status of published content.

## Abstraction Entry Points

**Pipeline Core:**
- `lib/agents/pipeline.ts` - Main entry point for the sequential agentic workflow.

**Platform Router:**
- `lib/platforms/oauth-handler.ts` - Generic handler logic for multi-platform OAuth integration.

---

*Architecture analysis: 2026-04-01*
*Update after major design pattern shifts*
