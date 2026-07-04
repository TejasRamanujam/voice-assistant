'use client'

import type { AssistantState } from '@/types'

const labels: Record<AssistantState, string> = {
  idle: 'Click mic to speak',
  listening: 'Listening...',
  processing: 'Thinking...',
  speaking: 'Speaking...',
}

const colors: Record<AssistantState, string> = {
  idle: 'text-white/30',
  listening: 'text-red-400',
  processing: 'text-yellow-400',
  speaking: 'text-indigo-400',
}

interface StatusIndicatorProps {
  state: AssistantState
  interimTranscript?: string
  error?: string
  wakeWordEnabled?: boolean
  wakeWord?: string
}

export function StatusIndicator({
  state,
  interimTranscript,
  error,
  wakeWordEnabled,
  wakeWord,
}: StatusIndicatorProps) {
  return (
    <div className="flex min-h-[3rem] flex-col items-center gap-1">
      {error ? (
        <p className="text-center text-sm text-red-400">{error}</p>
      ) : interimTranscript ? (
        <p className="text-center text-sm italic text-white/50">{interimTranscript}</p>
      ) : (
        <p className={`text-sm font-medium ${colors[state]}`}>{labels[state]}</p>
      )}

      {wakeWordEnabled && state === 'idle' && (
        <p className="text-xs text-white/20">
          Say &ldquo;{wakeWord}&rdquo; to activate
        </p>
      )}
    </div>
  )
}
