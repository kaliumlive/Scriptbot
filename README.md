# 🤖 Scriptbot: The Autonomous Content Engine

Scriptbot is a state-of-the-art platform for content creators and brands to automate their entire social media presence. Using a swarm of specialized AI agents, Scriptbot turns long-form videos into viral carousels, schedules posts at optimal times, and provides deep performance insights.

## 🚀 Key Features

- **Video Repurposer**: Automatically extracts viral hooks from your videos using Gemini Vision and generates high-converting carousels.
- **Agent Swarm**: 8 specialized agents handle everything from trend scouting to automated publishing.
- **Multi-Platform**: Native integration with YouTube, LinkedIn, Instagram, TikTok, and Twitter.
- **Brand Voice Learning**: Learns your unique tone and worldview from your existing content.
- **Premium Analytics**: AI-driven insights that tell you *exactly* what to post next.

## 🛠 Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Database/Auth**: Supabase
- **AI Models**: Gemini 1.5 Pro/Flash (Vision), Groq (Llama 3)
- **Video Processing**: FFmpeg (Browser-native)
- **Rendering**: Puppeteer-core with Chromium
- **Styling**: Vanilla CSS with modern glassmorphic design

## 📖 Getting Started

### 1. Prerequisites

- Node.js 20+
- Supabase Project
- API Keys: Gemini, Groq, and platform OAuth credentials.

### 2. Installation

```bash
git clone https://github.com/your-repo/scriptbot
cd scriptbot
npm install
```

### 3. Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

# OAuth Credentials
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

### 4. Database Setup

Run the migrations located in `supabase/migrations/` on your Supabase instance.

## 🧠 Agent Architecture

Scriptbot uses a decentralized agent model managed via `lib/agents/`:

1. **Trend Scout**: Monitors your niche for viral opportunities.
2. **Idea Generator**: Brainstorms concepts based on trends and your brand voice.
3. **Content Writer**: Crafts scripts and posts.
4. **Voice Learner**: Analyzes your content to build a digital twin of your voice.
5. **Video Repurposer**: Manages the video → frame → carousel pipeline.
6. **Scheduler**: Assigns posts to the calendar.
7. **Publisher**: Executes post uploads to social APIs.
8. **Analytics**: Processes metrics into actionable strategy.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## 📄 License

MIT License. Created with ❤️ by the Scriptbot Team.
