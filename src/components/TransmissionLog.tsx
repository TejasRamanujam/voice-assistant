'use client'

import { useEffect, useRef } from 'react'
import type { AssistantState, Message } from '@/types'

interface TransmissionLogProps {
  messages: Message[]
  state: AssistantState
  error: string
  interimTranscript: string
  onPrompt: (text: string) => void
  voiceUnsupported?: boolean
  onPlayDemo?: () => void
}

const SUGGESTIONS = [
  'What time is it right now?',
  'Search the web for tonight’s biggest headline',
  'Add “water the ferns” to my list',
  'What’s on my calendar this week?',
]

function stamp(date: Date) {
  return new Date(date).toLocaleTimeString('en-GB', { hour12: false })
}

export function TransmissionLog({
  messages,
  state,
  error,
  interimTranscript,
  onPrompt,
  voiceUnsupported,
  onPlayDemo,
}: TransmissionLogProps) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, state, interimTranscript, error])

  if (messages.length === 0 && state === 'idle' && !error) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto log-scroll px-4 sm:px-8">
        <div className="max-w-3xl pt-8 sm:pt-14 pb-10">
          <p className="text-[11px] tracking-wide2 uppercase text-signal font-semibold">
            No transmissions yet
          </p>
          <h2 className="mt-3 font-display italic font-medium text-ink leading-[1.05] text-[clamp(1.9rem,6vw,3.4rem)]">
            The wire is open.
            <br />
            Say something.
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-ink-mid max-w-md">
            Connection listens, thinks with Gemini, and answers out loud. It can
            search the web, keep your to&#8209;do list, read the calendar, and
            tell the time.
          </p>
          <ul className="mt-7 space-y-3">
            {SUGGESTIONS.map(s => (
              <li key={s}>
                <button
                  onClick={() => onPrompt(s)}
                  className="wire-link text-left text-[13px] sm:text-sm text-ink py-0.5"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
          {voiceUnsupported && (
            <p className="mt-7 text-[12px] leading-relaxed text-ink-dim max-w-md">
              This browser has no speech recognition (Safari and iOS don&rsquo;t expose it), so
              voice is off — typing works fully.{' '}
              {onPlayDemo && (
                <button onClick={onPlayDemo} className="wire-link text-signal">
                  Watch a sample exchange
                </button>
              )}
            </p>
          )}
        </div>
        <div ref={endRef} />
      </div>
    )
  }

  let tx = 0
  let rx = 0

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto log-scroll px-4 sm:px-8"
      aria-live="polite"
    >
      <div className="max-w-3xl pt-6 pb-10">
        {messages.map(m => {
          const isUser = m.role === 'user'
          const n = isUser ? ++tx : ++rx
          return (
            <article key={m.id} className="animate-entry-in py-5 sm:py-6">
              <header className="flex items-baseline gap-3 text-[10px] sm:text-[11px] tracking-tele uppercase">
                <span className={isUser ? 'text-ink-dim' : 'text-signal font-semibold'}>
                  {isUser ? 'TX' : 'RX'} {String(n).padStart(3, '0')}
                </span>
                <span className={isUser ? 'text-ink-mid' : 'text-ink font-semibold'}>
                  {isUser ? 'You' : 'Connection'}
                </span>
                <span className="text-ink-dim tabular-nums ml-auto" suppressHydrationWarning>
                  {stamp(m.createdAt)}
                </span>
              </header>
              {isUser ? (
                <p className="mt-2.5 text-[13px] sm:text-[15px] leading-relaxed text-ink-mid whitespace-pre-wrap">
                  {m.content}
                </p>
              ) : (
                <>
                  <p className="mt-3 font-display text-[clamp(1.15rem,3vw,1.55rem)] leading-[1.35] text-ink whitespace-pre-wrap">
                    {m.content}
                  </p>
                  {m.tools && m.tools.length > 0 && (
                    <ul className="mt-4 border-l border-signal/40 pl-3 space-y-2" aria-label="Tools used">
                      {m.tools.map((tool, index) => (
                        <li key={`${tool.toolName}-${index}`} className="text-[10px] sm:text-[11px] text-ink-dim">
                          <details className="group" open={Boolean(tool.result)}>
                            <summary className="cursor-pointer list-none tracking-tele uppercase marker:content-none">
                              <span className="text-signal font-semibold">relay {String(index + 1).padStart(2, '0')}</span>
                              {' · '}{tool.toolName.replaceAll('_', ' ')}
                              <span className="ml-2 text-[9px] text-ink-dim group-open:hidden">receipt +</span>
                              <span className="ml-2 text-[9px] text-ink-dim hidden group-open:inline">receipt −</span>
                            </summary>
                            {tool.result && (
                              <p className="mt-1.5 max-w-2xl normal-case tracking-normal leading-relaxed text-ink-mid whitespace-pre-wrap">
                                {tool.result}
                              </p>
                            )}
                          </details>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              <div className="log-rule mt-5 sm:mt-6" aria-hidden="true" />
            </article>
          )
        })}

        {interimTranscript && (
          <article className="py-5">
            <header className="text-[10px] sm:text-[11px] tracking-tele uppercase text-ink-dim">
              TX &mdash; hearing you&hellip;
            </header>
            <p className="mt-2.5 text-[13px] sm:text-[15px] leading-relaxed text-ink-dim italic">
              {interimTranscript}
              <span className="animate-caret text-signal" aria-hidden="true">▌</span>
            </p>
          </article>
        )}

        {state === 'processing' && (
          <article className="py-5 animate-entry-in" role="status">
            <header className="text-[10px] sm:text-[11px] tracking-tele uppercase text-signal font-semibold">
              RX &mdash; routing signal
            </header>
            <p className="mt-2.5 font-display italic text-lg text-ink-mid">
              thinking down the wire
              <span className="animate-caret text-signal" aria-hidden="true"> ▌</span>
            </p>
          </article>
        )}

        {error && (
          <article className="py-5 animate-entry-in" role="alert">
            <header className="text-[10px] sm:text-[11px] tracking-tele uppercase text-signal font-semibold">
              &times;&times; Signal fault
            </header>
            <p className="mt-2 text-[13px] sm:text-sm text-signal-deep">{error}</p>
          </article>
        )}

        <div ref={endRef} />
      </div>
    </div>
  )
}
