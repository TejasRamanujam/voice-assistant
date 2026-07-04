'use client'

import type { AssistantState } from '@/types'

interface MicButtonProps {
  state: AssistantState
  onClick: () => void
  disabled?: boolean
}

export function MicButton({ state, onClick, disabled }: MicButtonProps) {
  const isActive = state === 'listening'
  const isProcessing = state === 'processing'
  const isSpeaking = state === 'speaking'

  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple rings when listening */}
      {isActive && (
        <>
          <span className="ripple absolute h-24 w-24 rounded-full bg-red-500/20" />
          <span
            className="ripple absolute h-24 w-24 rounded-full bg-red-500/20"
            style={{ animationDelay: '0.5s' }}
          />
        </>
      )}

      {/* Pulse when speaking */}
      {isSpeaking && (
        <span className="absolute h-20 w-20 animate-pulse rounded-full bg-indigo-500/20" />
      )}

      <button
        onClick={onClick}
        disabled={disabled || isProcessing}
        aria-label={
          isActive ? 'Stop listening' : isSpeaking ? 'Speaking...' : 'Start listening'
        }
        className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:cursor-not-allowed disabled:opacity-50
          ${isActive ? 'scale-110 bg-red-500 shadow-lg shadow-red-500/40' : ''}
          ${isSpeaking ? 'bg-indigo-500 shadow-lg shadow-indigo-500/40' : ''}
          ${isProcessing ? 'bg-yellow-500/80 shadow-lg shadow-yellow-500/30' : ''}
          ${state === 'idle' ? 'bg-white/10 hover:bg-white/20 hover:scale-105' : ''}
        `}
      >
        {isProcessing ? (
          <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : isSpeaking ? (
          <div className="flex items-end gap-0.5 h-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} className="waveform-bar w-1 rounded-full bg-white" />
            ))}
          </div>
        ) : (
          <svg
            className="h-7 w-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={isActive ? 2.5 : 1.5}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </button>
    </div>
  )
}
