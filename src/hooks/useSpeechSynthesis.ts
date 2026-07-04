'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { UserPreferences } from '@/types'

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void
  stop: () => void
  isSpeaking: boolean
  voices: SpeechSynthesisVoice[]
  isSupported: boolean
}

// Priority list — highest quality first. Matched by substring so partial names work.
const VOICE_PRIORITY = [
  // Edge / Azure Neural (best quality, completely natural)
  'Aria Online (Natural)',
  'Jenny Online (Natural)',
  'Guy Online (Natural)',
  'Natasha Online (Natural)',
  'Ryan Online (Natural)',
  'Sonia Online (Natural)',
  'Libby Online (Natural)',
  // Chrome Google voices (good quality)
  'Google US English',
  'Google UK English Female',
  'Google UK English Male',
  // macOS
  'Samantha',
  'Karen',
  'Daniel',
]

function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const pref of VOICE_PRIORITY) {
    const match = voices.find(v => v.name.includes(pref))
    if (match) return match
  }
  // Fallback: first English voice
  return voices.find(v => v.lang.startsWith('en')) ?? null
}

export function useSpeechSynthesis(
  preferences: Pick<UserPreferences, 'voiceName' | 'voiceRate' | 'voicePitch' | 'ttsProvider'>
): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    if (!isSupported) return
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices()
      if (available.length > 0) setVoices(available)
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [isSupported])

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [isSupported])

  const speakWithBrowser = useCallback((text: string) => {
    if (!isSupported) return
    window.speechSynthesis.cancel()

    const chunks = splitIntoChunks(text, 200)
    const speakChunk = (index: number) => {
      if (index >= chunks.length) { setIsSpeaking(false); return }

      const utterance = new SpeechSynthesisUtterance(chunks[index])
      utterance.rate = preferences.voiceRate
      utterance.pitch = preferences.voicePitch

      // Use manually chosen voice, or auto-pick best available
      if (preferences.voiceName !== 'default') {
        const voice = voices.find(v => v.name === preferences.voiceName)
        if (voice) utterance.voice = voice
      } else {
        const best = pickBestVoice(voices)
        if (best) utterance.voice = best
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => speakChunk(index + 1)
      utterance.onerror = (e) => { if (e.error !== 'interrupted') setIsSpeaking(false) }
      utteranceRef.current = utterance
      window.speechSynthesis.speak(utterance)
    }
    speakChunk(0)
  }, [isSupported, preferences, voices])

  const speakWithAPI = useCallback(async (text: string, provider: 'openai' | 'elevenlabs') => {
    try {
      setIsSpeaking(true)
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, provider }),
      })
      if (!res.ok) throw new Error('TTS API failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url) }
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); speakWithBrowser(text) }
      audio.play()
    } catch {
      speakWithBrowser(text)
    }
  }, [speakWithBrowser])

  const speak = useCallback((text: string) => {
    if (!text.trim()) return
    if (preferences.ttsProvider === 'openai') {
      speakWithAPI(text, 'openai')
    } else if (preferences.ttsProvider === 'elevenlabs') {
      speakWithAPI(text, 'elevenlabs')
    } else {
      speakWithBrowser(text)
    }
  }, [preferences.ttsProvider, speakWithBrowser, speakWithAPI])

  useEffect(() => {
    return () => { if (isSupported) window.speechSynthesis.cancel() }
  }, [isSupported])

  return { speak, stop, isSpeaking, voices, isSupported }
}

function splitIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text]
  const chunks: string[] = []
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  let current = ''
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength && current) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current += sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}
