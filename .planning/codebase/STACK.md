# Technology Stack

**Analysis Date:** 2026-04-01

## Languages

**Primary:**
- TypeScript 5.x - All application code, API routes, and agentic logic.

**Secondary:**
- JavaScript - Build scripts and root configuration files (`eslint`, `postcss`, etc.).

## Runtime

**Environment:**
- Node.js 20.x or higher (standard for Next.js 16).
- Edge Runtime - Used sparingly in Middleware for performance.

**Package Manager:**
- npm - Managed via `package-lock.json`.

## Frameworks

**Core:**
- Next.js 16.2.1 - Web framework utilizing the App Router and Server Components.
- React 19.2.4 - UI library.
- Tailwind CSS 4.x - Modern CSS-in-JS alternative for high-performance styling.

**UI Component Library:**
- Radix UI - Primitive accessible UI components.
- Shadcn/UI - Custom components built on Radix and Tailwind.
- Lucide React & Custom SVG - Iconography (custom SVGs used for stability in critical areas).

**AI/LLM Logic:**
- Google Generative AI (@google/generative-ai) - Used for vision/text tasks (Gemini).
- Groq SDK (groq-sdk) - Used for low-latency inference.

## Key Dependencies

**Critical:**
- @supabase/supabase-js - Database interaction and authentication management.
- @ffmpeg/ffmpeg - Client/Server video processing.
- puppeteer-core - Browser automation for screenshotting and video processing.
- zod - Schema-first validation for API requests and internal data structures.
- date-fns - Professional date manipulation.

**Infrastructure:**
- next-themes - Light/Dark mode orchestration.
- sonner - Premium toast notifications.
- recharts - Dynamic analytics visualization.

## Configuration

**Environment:**
- `.env.local` - Local environment variables (gitignored).
- Vercel Environment Variables - Production secret management.

**Build:**
- `tsconfig.json` - Strict TypeScript configuration.
- `next.config.ts` - Next.js optimized build options.
- `components.json` - Shadcn/UI registry config.

## Platform Requirements

**Development:**
- Windows/macOS/Linux with Node.js installed.
- Local Supabase instance or remote development project.

**Production:**
- Vercel - Serverless hosting (optimized for Mumbai `ap-south-1` region for Supabase alignment).
- Supabase - Managed PostgreSQL and Auth.

---

*Stack analysis: 2026-04-01*
*Update after major dependency changes*
