# Requirements - Scriptbot

## Overview
This document defines the functional and technical requirements for the **Scriptbot V2: One-Man Content Agency**, focusing on intelligent ideation, storyboarding, and multi-platform tracking.

## Functional Requirements

### 1. Robust Platform Connections (FOUNDATION)
- **Instagram fix**: Resolve "Invalid Scopes" in Meta App.
- **Access Status**: Clear UI feedback for "Advanced Access" (Live) vs "Standard Access" (Dev).
- **Metric Tracking**: Automated sync of "likes", "shares", and "comments" via Graph APIs.

### 2. The Ideation & Concepting Agent
- **Idea Fleshing**: Input a single sentence and generate a 3-part script (Hook, Body, CTA).
- **Brainstorming**: Scrape viral trends to suggest "what's working now" in the user's defined niche.
- **Agent Collaboration**: Allow the user to "Ask the Agency" for revisions or alternate hooks.

### 3. Audio-Visual Storyboarder
- **Beat Management**: Each script line must be associated with a "Visual Cue" (mograph description, stock/movie scene).
- **YouTube Scraper Agent**: Search for iconic movie scenes and provide reference links within the storyboard.
- **B-Roll Markers**: Dedicated cues for phone-shot B-roll placement and mograph animation styles.

### 4. Consolidated Engagement Dashboard
- **Unified Growth View**: Aggregate views/likes from IG, YT, and LI into a single dashboard.
- **Engagement Insights**: AI analysis of "which posts outperformed" and *why*.

## Technical Requirements

### 5. Multi-Platform OAuth & Security
- **Graph API v19.0**: Support for the latest Instagram publishing and metrics endpoints.
- **Encryption**: Secure storage of all long-lived tokens in Supabase.
- **RLS**: Strict multi-tenant isolation.

### 6. Video & Visual Rendering
- **FFmpeg/Puppeteer Engine**: Stable rendering for generated carousels and storyboards.
- **Prompt Engineering**: High-quality prompt templates for Gemini Vision analysis.

## Success Criteria
- [ ] Successful end-to-end "Ideation → Storyboard → Publish" flow.
- [ ] Combined engagement metrics visible in a single unified UI.
- [ ] Reliable Instagram connection in "Live" mode with Advanced Access.
