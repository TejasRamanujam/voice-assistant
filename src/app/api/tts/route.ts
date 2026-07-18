import { NextRequest, NextResponse } from 'next/server'
import { MAX_TTS_CHARS, RATE_LIMITS } from '@/lib/limits'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const quota = checkRateLimit(`tts:${ip}`, RATE_LIMITS.tts.limit, RATE_LIMITS.tts.windowMs)
  if (!quota.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(quota.retryAfter) } }
    )
  }

  const contentLength = Number(req.headers.get('content-length') || 0)
  if (contentLength > 16 * 1024) {
    return NextResponse.json({ error: 'Request body is too large' }, { status: 413 })
  }

  const body = await req.json()
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const provider = body?.provider ?? 'openai'

  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 })
  }
  if (text.length > MAX_TTS_CHARS) {
    return NextResponse.json(
      { error: `Text must be ${MAX_TTS_CHARS} characters or fewer` },
      { status: 413 }
    )
  }

  if (provider === 'openai') {
    return generateOpenAI(text)
  }

  if (provider === 'elevenlabs') {
    return generateElevenLabs(text)
  }

  return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
}

async function generateOpenAI(text: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 503 })
  }

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',   // highest quality
        voice: 'nova',        // warm, natural female voice
        input: text,
        speed: 1.0,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI TTS error: ${err}`)
    }

    const audio = await res.arrayBuffer()
    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audio.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('OpenAI TTS error:', error)
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 })
  }
}

async function generateElevenLabs(text: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY
  const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'

  if (!apiKey) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 503 })
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    )

    if (!res.ok) throw new Error(`ElevenLabs error: ${await res.text()}`)

    const audio = await res.arrayBuffer()
    return new NextResponse(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audio.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error('ElevenLabs TTS error:', error)
    return NextResponse.json({ error: 'TTS generation failed' }, { status: 500 })
  }
}
