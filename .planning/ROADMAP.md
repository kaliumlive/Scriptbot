# Roadmap - Scriptbot

## Milestone 1: Foundations & Connections
**Goal**: Achieve a stable, production-ready connection to Instagram and ensure deployment parity.

### Phase 1: Connectivity Audit & Fix
- [ ] Debug Instagram OAuth redirect URI issues.
- [ ] Verify `brand_id` isolation in `platform_connections`.
- [ ] Add "Reconnect" and "Disconnect" UI lifecycle actions.

### Phase 2: Deployment Alignment
- [ ] Sync Vercel environment variables with local `.env.local`.
- [ ] Optimize serverless functions for `ap-south-1`.
- [ ] Finalize GitHub to Vercel production pipeline.

### Phase 3: Data Security (RLS)
- [ ] Audit all tables for Row Level Security.
- [ ] Implement policies for multi-tenant isolation.
- [ ] Secure credential storage.

---

## Milestone 2: Agentic Intelligence
**Goal**: Automate the high-quality content generation pipeline.

### Phase 4: Scripting Pipeline 2.0
- [ ] Integrate advanced Gemini/Groq prompt chaining for hooks and CTAs.
- [ ] Add creative vision analysis for visual beat mapping.
- [ ] Voice cloning integration for character authenticity.

### Phase 5: Automated Video Generation
- [ ] Refine FFmpeg/Puppeteer rendering engine.
- [ ] Implement robust background processing with retry loops.
- [ ] Automated thumbnail and caption generation.

---

## Milestone 3: Scale & Monitoring
**Goal**: Expand reach and track performance with precision.

### Phase 6: Multi-Platform Expansion
- [ ] Finalize LinkedIn and YouTube publishing flows.
- [ ] Implement cross-platform scheduler.

### Phase 7: Analytics & Optimization
- [ ] Real-time engagement monitoring dashboard.
- [ ] Agentic content optimization based on performance data.
- [ ] Cost and resource usage tracking.
