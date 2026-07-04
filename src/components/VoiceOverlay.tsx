'use client'

import { useEffect } from 'react'
import { ShaderOrb } from './ShaderOrb'
import type { AssistantState } from '@/types'

const STATUS_TEXT: Record<AssistantState, string> = {
  idle:       'Tap the orb to speak',
  listening:  'Listening…',
  processing: 'Thinking…',
  speaking:   'Speaking',
}

interface VoiceOverlayProps {
  state: AssistantState
  interimTranscript: string
  lastReply: string
  error: string
  onOrbClick: () => void
  onClose: () => void
}

export function VoiceOverlay({
  state, interimTranscript, lastReply, error, onOrbClick, onClose,
}: VoiceOverlayProps) {
  // Esc closes voice mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voice mode"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overlay-in
                 bg-void/85 backdrop-blur-2xl"
    >
      {/* Ambient state halo behind everything */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: state === 'processing'
            ? 'radial-gradient(ellipse 70% 55% at 50% 46%, rgba(76,201,240,0.10) 0%, transparent 65%)'
            : 'radial-gradient(ellipse 70% 55% at 50% 46%, rgba(124,92,255,0.12) 0%, transparent 65%)',
        }}
      />

      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Exit voice mode"
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center
                   text-ink-dim bg-white/[0.04] border border-line
                   hover:text-ink hover:bg-white/[0.08] transition-colors duration-150"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* The orb — tap to talk */}
      <button
        onClick={onOrbClick}
        aria-label={state === 'listening' ? 'Stop listening' : state === 'speaking' ? 'Stop speaking' : 'Start listening'}
        className="relative rounded-full cursor-pointer bg-transparent border-none p-0 orb-in
                   focus-visible:outline-offset-8"
      >
        <ShaderOrb state={state} size={380} className="pointer-events-none select-none" />
      </button>

      {/* Status caption */}
      <div
        key={state}
        className="mt-2 font-display text-[15px] font-medium tracking-wide text-ink-mid animate-status-in"
        role="status"
      >
        {STATUS_TEXT[state]}
      </div>

      {/* Live transcript / latest reply captions */}
      <div className="mt-5 min-h-[84px] max-w-[600px] px-8 text-center">
        {interimTranscript ? (
          <p className="text-[19px] leading-relaxed text-ink font-light animate-fade-in">
            {interimTranscript}
            <span className="inline-block w-[2px] h-[1.1em] ml-1 align-middle bg-accent-soft animate-pulse" />
          </p>
        ) : lastReply ? (
          <p className="text-[14px] leading-relaxed text-ink-dim line-clamp-3 animate-fade-in">
            {lastReply}
          </p>
        ) : null}
        {error && (
          <p className="mt-2 text-[13px] text-[#ff8f8f]" role="alert">{error}</p>
        )}
      </div>

      {/* Hint */}
      <div className="absolute bottom-7 text-[11.5px] tracking-wide text-ink-faint select-none">
        Tap orb to talk&ensp;·&ensp;Esc to exit
      </div>
    </div>
  )
}
