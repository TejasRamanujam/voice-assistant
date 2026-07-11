'use client'

import { useEffect, useState } from 'react'
import type { AssistantState } from '@/types'

interface MastheadProps {
  state: AssistantState
  wakeWordEnabled: boolean
  wakeWord: string
  onSettingsClick: () => void
}

const STATE_LABEL: Record<AssistantState, string> = {
  idle: 'STANDBY',
  listening: 'LISTENING',
  processing: 'ROUTING',
  speaking: 'SPEAKING',
}

export function Masthead({ state, wakeWordEnabled, wakeWord, onSettingsClick }: MastheadProps) {
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString('en-GB', { hour12: false })
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const live = state !== 'idle'

  return (
    <header className="relative z-10 px-4 sm:px-8 pt-3 sm:pt-5 shrink-0">
      {/* service row */}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] tracking-tele uppercase text-ink-mid">
        <a
          href="https://tejas-live-demos.vercel.app"
          className="wire-link py-1 text-ink-mid hover:text-signal"
        >
          &larr; Back to demos
        </a>
        <div className="flex items-center gap-3 sm:gap-5">
          <span suppressHydrationWarning className="tabular-nums hidden xs:inline sm:inline">
            {clock || '00:00:00'} LOCAL
          </span>
          <button
            onClick={onSettingsClick}
            className="wire-link py-1 uppercase tracking-tele text-ink-mid hover:text-signal"
          >
            Settings
          </button>
        </div>
      </div>

      {/* title row */}
      <div className="mt-1 sm:mt-2 flex items-end justify-between gap-3">
        <h1 className="font-display font-black leading-[0.9] tracking-tight text-ink text-[clamp(3rem,13vw,7.5rem)] select-none">
          Connection
        </h1>
        <div className="hidden md:flex flex-col items-end pb-3 text-[11px] tracking-tele uppercase text-ink-mid whitespace-nowrap">
          <span>A voice on the wire,</span>
          <span>traced on paper.</span>
        </div>
      </div>

      {/* meta rule */}
      <div className="double-rule mt-2 sm:mt-3 pt-3 pb-2 flex items-center gap-x-4 gap-y-1 flex-wrap text-[10px] sm:text-[11px] tracking-tele uppercase">
        <span className="flex items-center gap-2 font-semibold" aria-live="polite">
          <span
            aria-hidden="true"
            className={`inline-block w-2 h-2 rounded-full ${
              live ? 'bg-signal animate-lamp' : 'bg-ink-dim'
            }`}
          />
          <span className={live ? 'text-signal' : 'text-ink'}>{STATE_LABEL[state]}</span>
        </span>
        <span className="text-ink-dim hidden sm:inline">Field station 01</span>
        <span className="text-ink-dim">Gemini 2.5 relay</span>
        <span className="text-ink-dim hidden sm:inline">
          Wake &ldquo;{wakeWord}&rdquo; {wakeWordEnabled ? 'armed' : 'off'}
        </span>
      </div>
    </header>
  )
}
