'use client'

import type { AssistantState } from '@/types'

const STATE_META: Record<AssistantState, { label: string; dot: string; pulse: boolean }> = {
  idle:       { label: 'Ready',     dot: '#8b87a8', pulse: false },
  listening:  { label: 'Listening', dot: '#7c5cff', pulse: true },
  processing: { label: 'Thinking',  dot: '#4cc9f0', pulse: true },
  speaking:   { label: 'Speaking',  dot: '#a878ff', pulse: true },
}

interface HeaderProps {
  state: AssistantState
  wakeWordEnabled: boolean
  wakeWord: string
  onSettingsClick: () => void
}

export function Header({ state, wakeWordEnabled, wakeWord, onSettingsClick }: HeaderProps) {
  const meta = STATE_META[state]

  return (
    <header className="relative z-20 h-14 shrink-0 flex items-center gap-3 px-4 sm:px-6
                       border-b border-line bg-white/[0.015] backdrop-blur-xl">
      {/* Wordmark + live presence */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          aria-hidden
          className="relative flex w-2.5 h-2.5"
        >
          {meta.pulse && (
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
              style={{ background: meta.dot }}
            />
          )}
          <span
            className="relative inline-flex w-2.5 h-2.5 rounded-full transition-colors duration-500"
            style={{ background: meta.dot, boxShadow: `0 0 10px ${meta.dot}` }}
          />
        </span>
        <span className="font-display text-[15.5px] font-semibold tracking-tight text-ink">
          Connection
        </span>
        <span className="hidden sm:inline text-[11px] text-ink-faint font-medium tabular-nums transition-colors duration-300">
          {meta.label}
        </span>
      </div>

      <div className="flex-1" />

      {/* Wake word chip */}
      {wakeWordEnabled && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full select-none
                        bg-accent/[0.07] border border-accent/20">
          <span
            aria-hidden
            className="w-1.5 h-1.5 rounded-full bg-accent"
            style={{ animation: 'wake-glow 2.2s ease-in-out infinite' }}
          />
          <span className="text-[11px] font-medium text-ink-mid">&ldquo;{wakeWord || 'hey connection'}&rdquo;</span>
        </div>
      )}

      {/* Back to demos */}
      <a
        href="https://tejas-live-demos.vercel.app"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium
                   text-ink-dim border border-line hover:border-line-strong hover:text-ink
                   hover:bg-white/[0.03] transition-colors duration-150"
      >
        <span aria-hidden>←</span>
        <span className="hidden sm:inline">Back to demos</span>
        <span className="sm:hidden">Demos</span>
      </a>

      {/* Settings */}
      <button
        onClick={onSettingsClick}
        aria-label="Open settings"
        className="w-8 h-8 rounded-card cursor-pointer flex items-center justify-center
                   bg-transparent border-none text-ink-dim hover:text-ink hover:bg-white/[0.05]
                   transition-colors duration-150"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </header>
  )
}
