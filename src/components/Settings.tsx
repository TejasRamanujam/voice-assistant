'use client'

import { useEffect, useState } from 'react'
import type { UserPreferences } from '@/types'

interface SettingsProps {
  preferences: UserPreferences
  onChange: (prefs: Partial<UserPreferences>) => void
  voices: SpeechSynthesisVoice[]
  onClose: () => void
}

export function Settings({ preferences, onChange, voices, onClose }: SettingsProps) {
  const [localVoices, setLocalVoices] = useState<SpeechSynthesisVoice[]>(voices)

  useEffect(() => {
    if (voices.length > 0) setLocalVoices(voices)
  }, [voices])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="glass-edge relative z-10 w-full max-w-md rounded-t-shell sm:rounded-shell border border-line-strong bg-raised/80 backdrop-blur-2xl p-6 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.8),0_0_40px_-20px_rgba(124,92,255,0.4)] animate-msg-in">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-card p-1 text-ink-dim hover:text-ink transition-colors duration-150"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {/* Voice selection */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-mid">Voice</label>
            <select
              value={preferences.voiceName}
              onChange={(e) => onChange({ voiceName: e.target.value })}
              className="w-full rounded-card border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none transition-colors duration-150"
            >
              <option value="default">Default</option>
              {localVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* TTS provider */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-mid">TTS Provider</label>
            <div className="flex gap-2">
              {(['browser', 'openai', 'elevenlabs'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onChange({ ttsProvider: p })}
                  className={`flex-1 rounded-card px-3 py-2 text-sm font-medium transition-colors duration-150
                    ${preferences.ttsProvider === p
                      ? 'bg-accent text-white shadow-[0_2px_14px_rgba(124,92,255,0.35)]'
                      : 'bg-white/5 text-ink-dim hover:bg-white/10 hover:text-ink'
                    }`}
                >
                  {p === 'browser' ? 'Browser (free)' : p === 'openai' ? 'OpenAI Nova' : 'ElevenLabs'}
                </button>
              ))}
            </div>
          </div>

          {/* Speech rate */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-mid">
              <span>Speech Rate</span>
              <span className="text-ink-dim tabular-nums">{preferences.voiceRate.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={preferences.voiceRate}
              onChange={(e) => onChange({ voiceRate: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Pitch */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-mid">
              <span>Pitch</span>
              <span className="text-ink-dim tabular-nums">{preferences.voicePitch.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={preferences.voicePitch}
              onChange={(e) => onChange({ voicePitch: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Wake word toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-ink">Wake Word</p>
              <p className="text-xs text-ink-dim">Activate hands-free</p>
            </div>
            <button
              onClick={() => onChange({ wakeWordEnabled: !preferences.wakeWordEnabled })}
              role="switch"
              aria-checked={preferences.wakeWordEnabled}
              aria-label="Toggle wake word"
              className={`relative h-6 w-11 rounded-full transition-colors duration-200
                ${preferences.wakeWordEnabled ? 'bg-accent' : 'bg-white/10'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200
                  ${preferences.wakeWordEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          {preferences.wakeWordEnabled && (
            <div className="animate-fade-in">
              <label className="mb-1.5 block text-xs font-medium text-ink-mid">Wake Word Phrase</label>
              <input
                type="text"
                value={preferences.wakeWord}
                onChange={(e) => onChange({ wakeWord: e.target.value })}
                placeholder="hey assistant"
                className="w-full rounded-card border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none transition-colors duration-150"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
