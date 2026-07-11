'use client'

import { useEffect, useRef } from 'react'
import type { UserPreferences } from '@/types'

interface SettingsSheetProps {
  preferences: UserPreferences
  voices: SpeechSynthesisVoice[]
  onChange: (updates: Partial<UserPreferences>) => void
  onClose: () => void
}

export function SettingsSheet({ preferences, voices, onChange, onClose }: SettingsSheetProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const englishVoices = voices.filter(v => v.lang.startsWith('en'))
  const list = englishVoices.length > 0 ? englishVoices : voices

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:justify-end">
      {/* scrim */}
      <button
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30 animate-fade-in cursor-default"
        tabIndex={-1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="relative w-full sm:w-[380px] sm:h-full max-h-[85vh] sm:max-h-none overflow-y-auto log-scroll
                   bg-paper border-t-2 sm:border-t-0 sm:border-l-2 border-ink px-5 sm:px-7 py-6 animate-sheet-in"
      >
        <div className="flex items-baseline justify-between">
          <h2 className="font-display font-black text-3xl text-ink">Settings</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="text-[11px] tracking-tele uppercase text-ink-mid hover:text-signal wire-link py-1"
          >
            Close &times;
          </button>
        </div>
        <div className="double-rule mt-3 pt-4" />

        {/* Wake word */}
        <section className="mt-4">
          <h3 className="text-[11px] tracking-wide2 uppercase text-signal font-semibold">Wake word</h3>
          <label className="mt-3 flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm text-ink">Hands-free wake</span>
            <input
              type="checkbox"
              checked={preferences.wakeWordEnabled}
              onChange={e => onChange({ wakeWordEnabled: e.target.checked })}
              className="w-4 h-4 accent-[#D9420B]"
            />
          </label>
          <label className="mt-3 block">
            <span className="text-xs text-ink-mid">Phrase</span>
            <input
              type="text"
              value={preferences.wakeWord}
              onChange={e => onChange({ wakeWord: e.target.value })}
              className="mt-1 w-full bg-transparent border-b border-paper-line focus:border-ink
                         text-sm text-ink py-1.5 outline-none focus-visible:outline-none"
            />
          </label>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-dim">
            Keeps the microphone open in the background and opens the live
            channel when it hears the phrase. Chrome or Edge only.
          </p>
        </section>

        <div className="log-rule mt-6" />

        {/* Voice out */}
        <section className="mt-6">
          <h3 className="text-[11px] tracking-wide2 uppercase text-signal font-semibold">Voice out</h3>

          <label className="mt-3 block">
            <span className="text-xs text-ink-mid">Engine</span>
            <select
              value={preferences.ttsProvider}
              onChange={e =>
                onChange({ ttsProvider: e.target.value as UserPreferences['ttsProvider'] })
              }
              className="mt-1 w-full bg-transparent border-b border-paper-line focus:border-ink
                         text-sm text-ink py-1.5 outline-none focus-visible:outline-none"
            >
              <option value="browser">Browser (free, instant)</option>
              <option value="openai">OpenAI — nova (cloud)</option>
              <option value="elevenlabs">ElevenLabs (cloud)</option>
            </select>
          </label>

          {preferences.ttsProvider === 'browser' && (
            <>
              <label className="mt-4 block">
                <span className="text-xs text-ink-mid">Voice</span>
                <select
                  value={preferences.voiceName}
                  onChange={e => onChange({ voiceName: e.target.value })}
                  className="mt-1 w-full bg-transparent border-b border-paper-line focus:border-ink
                             text-sm text-ink py-1.5 outline-none focus-visible:outline-none"
                >
                  <option value="default">Auto — best available</option>
                  {list.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block">
                <span className="flex justify-between text-xs text-ink-mid">
                  <span>Rate</span>
                  <span className="tabular-nums">{preferences.voiceRate.toFixed(1)}&times;</span>
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={preferences.voiceRate}
                  onChange={e => onChange({ voiceRate: parseFloat(e.target.value) })}
                />
              </label>

              <label className="mt-2 block">
                <span className="flex justify-between text-xs text-ink-mid">
                  <span>Pitch</span>
                  <span className="tabular-nums">{preferences.voicePitch.toFixed(1)}</span>
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={preferences.voicePitch}
                  onChange={e => onChange({ voicePitch: parseFloat(e.target.value) })}
                />
              </label>
            </>
          )}
        </section>

        <div className="log-rule mt-6" />

        <p className="mt-5 text-[11px] leading-relaxed text-ink-dim">
          Connection &mdash; field station 01. Speech recognition and synthesis
          run in your browser; thinking is relayed to Gemini 2.5 Flash.
        </p>
      </div>
    </div>
  )
}
