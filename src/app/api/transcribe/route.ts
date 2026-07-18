import { NextRequest, NextResponse } from 'next/server'
import { MAX_AUDIO_BYTES, RATE_LIMITS } from '@/lib/limits'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Server-side Whisper STT fallback (for browsers without Web Speech API)
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const quota = checkRateLimit(
    `transcribe:${ip}`,
    RATE_LIMITS.transcribe.limit,
    RATE_LIMITS.transcribe.windowMs
  )
  if (!quota.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(quota.retryAfter) } }
    )
  }

  const contentLength = Number(req.headers.get('content-length') || 0)
  if (contentLength > MAX_AUDIO_BYTES + 256 * 1024) {
    return NextResponse.json({ error: 'Audio exceeds the 5 MB demo limit' }, { status: 413 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 503 })
  }

  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file required' }, { status: 400 })
    }
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'An audio file is required' }, { status: 415 })
    }
    if (audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'Audio exceeds the 5 MB demo limit' }, { status: 413 })
    }

    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, 'audio.webm')
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('language', 'en')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Whisper error: ${err}`)
    }

    const data = await res.json()
    return NextResponse.json({ text: data.text })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
