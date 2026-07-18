export const MAX_MESSAGE_CHARS = 1200
export const MAX_AGENT_STEPS = 4
export const MAX_TOOL_CALLS_PER_STEP = 2
export const MAX_TTS_CHARS = 1800
export const MAX_AUDIO_BYTES = 5 * 1024 * 1024

export const RATE_LIMITS = {
  chat: { limit: 8, windowMs: 60_000 },
  tts: { limit: 6, windowMs: 60_000 },
  transcribe: { limit: 4, windowMs: 60_000 },
} as const
