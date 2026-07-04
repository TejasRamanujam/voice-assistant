'use client'

import { useCallback, useState } from 'react'
import type { AssistantState } from '@/types'

interface InputDockProps {
  state: AssistantState
  isSupported: boolean
  onSubmitText: (text: string) => void
  onVoiceMode: () => void
}

export function InputDock({ state, isSupported, onSubmitText, onVoiceMode }: InputDockProps) {
  const [inputText, setInputText] = useState('')

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || state !== 'idle') return
    onSubmitText(inputText.trim())
    setInputText('')
  }, [inputText, state, onSubmitText])

  return (
    <div className="shrink-0 relative z-10 px-4 pb-4 sm:pb-6 pt-2">
      <div className="mx-auto w-full max-w-[720px] flex items-center gap-2.5">
        {/* Glass command bar */}
        <form
          onSubmit={handleSubmit}
          className="glass-edge flex-1 flex items-center gap-1 pl-5 pr-1.5 py-1.5 rounded-full
                     bg-white/[0.035] border border-line backdrop-blur-xl
                     shadow-[0_18px_44px_-18px_rgba(0,0,0,0.7)]
                     focus-within:border-accent/40 focus-within:shadow-[0_0_0_3px_rgba(124,92,255,0.10),0_18px_44px_-18px_rgba(0,0,0,0.7)]
                     transition-[border-color,box-shadow] duration-200"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={state !== 'idle'}
            placeholder="Message Connection…"
            aria-label="Message Connection"
            className="flex-1 min-w-0 bg-transparent border-none outline-none py-2
                       text-[14px] text-ink placeholder:text-ink-faint disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || state !== 'idle'}
            aria-label="Send message"
            className="w-9 h-9 rounded-full shrink-0 cursor-pointer flex items-center justify-center border-none
                       text-white shadow-[0_2px_14px_rgba(124,92,255,0.4)]
                       disabled:opacity-30 disabled:cursor-default disabled:shadow-none
                       hover:brightness-110 transition-all duration-150"
            style={{ background: 'linear-gradient(135deg, #8c7bff, #5a42d8)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </form>

        {/* Voice mode — the signature control */}
        <button
          onClick={onVoiceMode}
          title={!isSupported ? 'Speech not supported in this browser — text still works' : 'Enter voice mode'}
          aria-label="Enter voice mode"
          className={`relative w-[52px] h-[52px] rounded-full shrink-0 cursor-pointer
                      flex items-center justify-center text-ink
                      border border-transparent
                      hover:scale-105 active:scale-95 transition-transform duration-200
                      ${state === 'listening' ? 'mic-listening' : state === 'processing' ? 'mic-processing' : ''}`}
          style={{
            background: 'linear-gradient(#0d0d14, #0d0d14) padding-box, linear-gradient(135deg, #a794ff 0%, #7c5cff 45%, #4cc9f0 120%) border-box',
            borderWidth: 2,
            opacity: !isSupported ? 0.55 : 1,
            boxShadow: '0 0 22px rgba(124,92,255,0.28)',
          }}
        >
          {/* Voice waveform glyph */}
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="10" x2="4" y2="14" />
            <line x1="8.5" y1="7" x2="8.5" y2="17" />
            <line x1="13" y1="4" x2="13" y2="20" />
            <line x1="17.5" y1="8" x2="17.5" y2="16" />
            <line x1="22" y1="11" x2="22" y2="13" />
          </svg>
        </button>
      </div>

      <p className="mt-2.5 text-center text-[10.5px] tracking-wide text-ink-faint select-none">
        Voice, wake word &amp; tools · Gemini-powered demo
      </p>
    </div>
  )
}
