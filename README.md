# Connection — Voice Assistant

![CI](https://github.com/TejasRamanujam/Connection-Voice-Assistant/actions/workflows/ci.yml/badge.svg)

**Live: https://connection-assistant.vercel.app**

A voice assistant with tool calling: speak, it thinks with Gemini, and answers out loud. Falls back to text chat in any browser.

## Features
- Speech in / speech out (Web Speech API — Chrome/Edge; text input everywhere)
- Agentic tool loop: web search, to-do list, calendar, clock
- Live transcript with interim speech shown as you talk
- 26 Jest tests across components, API handlers, and tools

## Stack
Next.js 14 + TypeScript · Gemini via OpenAI-compatible endpoint · Prisma · Jest + Testing Library

## Run locally
```bash
npm install
echo "GEMINI_API_KEY=..." > .env.local
npm run dev
```
`npm test` runs the suite; `npm run build` needs no env vars.
