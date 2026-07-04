# Voice Assistant

AI voice assistant powered by Claude. Web Speech API for STT, Web Speech Synthesis (or ElevenLabs) for TTS, Next.js frontend, SQLite persistence.

## Architecture

```
Microphone → Web Speech API (STT) → /api/chat → Claude API (claude-haiku)
           ↑ wake word (continuous)       ↓ tool calls (search/todos/calendar)
Web Speech Synthesis (TTS) ← response text ←
```

## Quick Start

```bash
cd voice-assistant
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY and NEXTAUTH_SECRET at minimum
npm install
npm run db:push
npm run dev
```

Open http://localhost:3000. Click the mic and speak.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `NEXTAUTH_SECRET` | Yes | Random string: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | App URL (http://localhost:3000 for dev) |
| `GITHUB_ID` | For auth | GitHub OAuth App client ID |
| `GITHUB_SECRET` | For auth | GitHub OAuth App client secret |
| `ELEVENLABS_API_KEY` | Optional | Premium TTS |
| `ELEVENLABS_VOICE_ID` | Optional | ElevenLabs voice ID |
| `DATABASE_URL` | Yes | SQLite: `file:./dev.db` |

## Features

- **Voice input** — Web Speech API (Chrome/Edge). Whisper API fallback via `/api/transcribe`
- **LLM** — Claude Haiku with streaming tool calls
- **TTS** — Browser Web Speech Synthesis (free) or ElevenLabs (premium)
- **Wake word** — Say "hey assistant" (configurable) to activate hands-free
- **Tools** — Web search, current time, to-do list, calendar events
- **Auth** — GitHub/Google OAuth via NextAuth.js
- **Persistence** — SQLite with Prisma (last 20 conversations, 50 messages each)
- **Settings** — Voice selection, speed/pitch, wake word toggle, TTS provider

## Development

```bash
npm run dev          # dev server on :3000
npm test             # run jest tests
npm run db:studio    # Prisma Studio GUI
npm run db:migrate   # run migrations
```

## Deploy

### Vercel (recommended)
```bash
npm i -g vercel
vercel
# Set env vars in Vercel dashboard
# For SQLite use Turso or switch DATABASE_URL to Postgres (Neon/Supabase)
```

### Docker
```bash
docker compose up -d
```

### Postgres (production)
Change `prisma/schema.prisma` provider to `postgresql` and update `DATABASE_URL`:
```
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

## Browser Support

Voice input requires Chrome, Edge, or Safari (partial). Firefox does not support Web Speech API — use the text input fallback.
