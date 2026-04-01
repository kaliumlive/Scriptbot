# Requirements - Scriptbot

## Overview
This document defines the functional and technical requirements for the Scriptbot project, focusing on achieving a stable, agentic content automation engine.

## Functional Requirements

### 1. Robust Platform Connections
- **Instagram Business Integration**: Fix the current connection issues (likely OAuth redirect/scope related).
- **Multi-Brand Support**: Ensure platform connections are correctly isolated by `brand_id`.
- **Connection Diagnostics**: Provide clear UI feedback (toasts/alerts) when credentials are missing or token exchange fails.

### 2. Enhanced Agentic Flow
- **Script Generation**: Refine the Gemini/Groq pipeline for higher quality, viral-ready hooks and scripts.
- **Visual Intelligence**: Automate the mapping of script beats to visual assets or generated imagery.
- **Verification Loop**: Agents must verify successful publication and store the platform post URL.

### 3. Video Processing Stability
- **FFmpeg/Puppeteer Robustness**: Implement better retry logic and resource cleanup for local and server-side video rendering.
- **Storage Sync**: Automated upload of processed videos to Supabase Storage.

## Technical Requirements

### 4. Infrastructure & Deployment
- **Vercel Alignment**: Sync environment variables and region settings (`ap-south-1`) with Supabase to minimize latency.
- **GitHub Integration**: Ensure clean CI/CD flow from repository to Vercel production.

### 5. Security & Data Integrity
- **Supabase RLS**: Audit and implement Row Level Security for `platform_connections` and `content_drafts`.
- **Token Encryption**: Ensure long-lived tokens are handled securely.

## Success Criteria
- [ ] Successful connection to an Instagram Business account.
- [ ] Zero-error end-to-end flow from "Generate Script" to "Publish to IG".
- [ ] Vercel deployment reflects the latest GitHub `main` branch with all environment variables active.
