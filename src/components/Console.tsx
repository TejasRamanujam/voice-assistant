'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Masthead } from './Masthead'
import { StripChart } from './StripChart'
import { TransmissionLog } from './TransmissionLog'
import { TransmitBar } from './TransmitBar'
import { VoiceDeck } from './VoiceDeck'
import { SettingsSheet } from './SettingsSheet'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { useWakeWord } from '@/hooks/useWakeWord'
import type { AssistantState, Message, UserPreferences } from '@/types'

const DEFAULT_PREFS: UserPreferences = {
  voiceName: 'default',
  voiceRate: 1.0,
  voicePitch: 1.0,
  wakeWordEnabled: false,
  wakeWord: 'hey connection',
  ttsProvider: 'browser',
}

const STATE_LABEL: Record<AssistantState, string> = {
  idle: 'standby',
  listening: 'listening',
  processing: 'routing',
  speaking: 'speaking',
}

// Scripted exchange for browsers without speech recognition (Safari/iOS):
// shows the voice flow without a microphone. Client-side only.
const DEMO_EXCHANGE: Array<[string, string]> = [
  ['What time is it right now?', 'It’s 3:42 in the afternoon.'],
  ['Add “water the ferns” to my list', 'Done — “water the ferns” is on your list.'],
  ['What’s on my calendar this week?', 'Two events: a project review on Wednesday and coffee with Sam on Friday at nine.'],
]

export function Console() {
  const [messages, setMessages] = useState<Message[]>([])
  const [state, setState] = useState<AssistantState>('idle')
  const [error, setError] = useState<string>('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [voiceMode, setVoiceMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFS)
  const abortRef = useRef<AbortController | null>(null)
  const demoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => demoTimersRef.current.forEach(clearTimeout), [])

  const playDemo = useCallback(() => {
    let delay = 0
    DEMO_EXCHANGE.forEach(([question, answer], i) => {
      delay += 500
      demoTimersRef.current.push(
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { id: `demo-u-${i}`, role: 'user', content: question, createdAt: new Date() },
          ])
        }, delay)
      )
      delay += 1100
      demoTimersRef.current.push(
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { id: `demo-a-${i}`, role: 'assistant', content: answer, createdAt: new Date() },
          ])
        }, delay)
      )
    })
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('voice-assistant-prefs')
    if (saved) {
      try {
        setPreferences({ ...DEFAULT_PREFS, ...JSON.parse(saved) })
      } catch {}
    }
  }, [])

  const savePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const next = { ...prev, ...updates }
      localStorage.setItem('voice-assistant-prefs', JSON.stringify(next))
      return next
    })
  }, [])

  const { speak, stop: stopSpeaking, isSpeaking, voices } = useSpeechSynthesis(preferences)

  const handleTranscript = useCallback(
    async (text: string) => {
      if (!text.trim() || state === 'processing') return
      setError('')
      setState('processing')

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        createdAt: new Date(),
      }
      setMessages(prev => [...prev, userMsg])

      try {
        abortRef.current = new AbortController()
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, conversationId }),
          signal: abortRef.current.signal,
        })

        if (res.status === 429) {
          setError('The relay is over its free-tier rate limit — give it a minute and try again.')
          setState('idle')
          return
        }
        if (!res.ok) throw new Error('Failed to get response')
        const data = await res.json()
        if (data.conversationId) setConversationId(data.conversationId)

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          createdAt: new Date(),
        }
        setMessages(prev => [...prev, assistantMsg])
        setState('speaking')
        speak(data.response)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setError('The relay did not answer. Check the API key and try again.')
        setState('idle')
      }
    },
    [state, conversationId, speak]
  )

  useEffect(() => {
    if (state === 'speaking' && !isSpeaking) setState('idle')
  }, [isSpeaking, state])

  const { isListening, isSupported, start, stop, interimTranscript } = useSpeechRecognition({
    onTranscript: handleTranscript,
    onError: err => {
      setError(err)
      setState('idle')
    },
  })

  useEffect(() => {
    if (isListening) setState('listening')
    else if (state === 'listening') setState('idle')
  }, [isListening]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wake word opens the live channel hands-free
  useWakeWord({
    wakeWord: preferences.wakeWord,
    enabled: preferences.wakeWordEnabled && state === 'idle' && !voiceMode,
    onDetected: useCallback(() => {
      if (state === 'idle') {
        setVoiceMode(true)
        start()
      }
    }, [state, start]),
  })

  // Telegraph key inside the deck: cycles the interaction state machine
  const handleKeyClick = useCallback(() => {
    if (state === 'speaking') {
      stopSpeaking()
      setState('idle')
      return
    }
    if (state === 'listening') {
      stop()
      return
    }
    if (state === 'processing') {
      abortRef.current?.abort()
      setState('idle')
      return
    }
    start()
  }, [state, stopSpeaking, stop, start])

  // Mic button in the transmit bar: listen INLINE — the strip chart is the
  // trace, words land in the log. (The deck stays reserved for the wake word.)
  const handleEnterVoiceMode = handleKeyClick

  // Leaving the deck: quiesce everything
  const handleExitVoiceMode = useCallback(() => {
    setVoiceMode(false)
    stopSpeaking()
    stop()
    abortRef.current?.abort()
    setState('idle')
  }, [stopSpeaking, stop])

  const lastReply = [...messages].reverse().find(m => m.role === 'assistant')?.content ?? ''

  return (
    <div className="grain relative w-full h-full overflow-hidden flex flex-col bg-paper text-ink">
      <Masthead
        state={state}
        wakeWordEnabled={preferences.wakeWordEnabled}
        wakeWord={preferences.wakeWord}
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* the chart recorder — always running, always honest */}
      <div className="relative z-10 shrink-0 mx-4 sm:mx-8 mt-2 h-16 sm:h-24 border border-paper-line bg-paper-deep/40">
        <StripChart state={state} kick={interimTranscript.length} paused={voiceMode} />
        <span className="absolute left-2 top-1.5 text-[9px] sm:text-[10px] tracking-wide2 uppercase text-ink-dim">
          CH&#8211;01 &middot; voice trace
        </span>
        <span className="absolute right-2 top-1.5 text-[9px] sm:text-[10px] tracking-wide2 uppercase text-signal font-semibold">
          {STATE_LABEL[state]}
        </span>
      </div>

      <main className="relative z-10 flex-1 flex flex-col overflow-hidden min-h-0">
        <TransmissionLog
          messages={messages}
          state={state}
          error={error}
          interimTranscript={voiceMode ? '' : interimTranscript}
          onPrompt={handleTranscript}
          voiceUnsupported={!isSupported}
          onPlayDemo={playDemo}
        />
        <TransmitBar
          state={state}
          isSupported={isSupported}
          onSubmitText={handleTranscript}
          onVoiceMode={handleEnterVoiceMode}
        />
      </main>

      {voiceMode && (
        <VoiceDeck
          state={state}
          interimTranscript={interimTranscript}
          lastReply={lastReply}
          error={error}
          onKeyClick={handleKeyClick}
          onClose={handleExitVoiceMode}
        />
      )}

      {showSettings && (
        <SettingsSheet
          preferences={preferences}
          voices={voices}
          onChange={savePreferences}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}
