// -- ANTHROPIC (re-enable by swapping the blocks below) --
// import Anthropic from '@anthropic-ai/sdk'
// export const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
// export const MODEL = 'claude-haiku-4-5-20251001'

import OpenAI from 'openai'
// Gemini via its OpenAI-compatible endpoint (supports tool-calling).
export const client = new OpenAI({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  apiKey: process.env.GEMINI_API_KEY,
})
export const MODEL = 'gemini-2.5-flash'

export const SYSTEM_PROMPT = `You are a helpful, conversational AI voice assistant.
Keep responses concise and natural for spoken conversation — avoid bullet points, markdown formatting, or long lists unless specifically asked.
Speak in a friendly, direct tone. For simple questions give short answers. For complex topics, summarize key points.
When using tools, briefly mention what you're doing before presenting results.`

export const MAX_TOKENS = 1024
