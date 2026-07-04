'use client'

import { useEffect, useRef } from 'react'
import { ShaderOrb } from './ShaderOrb'
import type { AssistantState, Message } from '@/types'

/* Bento capability cards — mirror the assistant's real backend tools */
const CAPABILITIES = [
  {
    title: 'Search the web',
    prompt: "What's the latest news in AI?",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    title: 'Manage todos',
    prompt: 'Add "book dentist appointment" to my todo list',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    title: 'Check calendar',
    prompt: "What's on my calendar this week?",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: 'Time & date',
    prompt: 'What time is it right now?',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" />
      </svg>
    ),
  },
]

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

interface ChatSurfaceProps {
  messages: Message[]
  state: AssistantState
  error: string
  interimTranscript: string
  onPrompt: (text: string) => void
}

export function ChatSurface({ messages, state, error, interimTranscript, onPrompt }: ChatSurfaceProps) {
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, interimTranscript, state])

  const isEmpty = messages.length === 0 && !interimTranscript && state !== 'processing'

  return (
    <div ref={threadRef} className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto w-full max-w-[720px] px-4 sm:px-6 py-6 flex flex-col min-h-full">

        {isEmpty ? (
          /* ---------- Empty state: hero orb + bento capabilities ---------- */
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div className="orb-in">
              <ShaderOrb state={state} size={230} />
            </div>

            <h1 className="mt-2 font-display text-[clamp(22px,4.5vw,30px)] font-semibold tracking-tight text-ink text-center stagger-in"
                style={{ animationDelay: '80ms' }}>
              How can I help?
            </h1>
            <p className="mt-2 text-[13.5px] text-ink-dim text-center max-w-[340px] leading-relaxed stagger-in"
               style={{ animationDelay: '140ms' }}>
              Speak or type — I can search the web, keep your todo list, and check your calendar.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[560px]">
              {CAPABILITIES.map((cap, i) => (
                <button
                  key={cap.title}
                  onClick={() => onPrompt(cap.prompt)}
                  className="group text-left p-4 rounded-panel cursor-pointer stagger-in
                             bg-white/[0.025] border border-line backdrop-blur-md
                             hover:bg-white/[0.045] hover:border-line-strong hover:-translate-y-0.5
                             hover:shadow-[0_12px_32px_-12px_rgba(124,92,255,0.25)]
                             transition-all duration-200"
                  style={{ animationDelay: `${200 + i * 70}ms` }}
                >
                  <span className="inline-flex w-8 h-8 rounded-card items-center justify-center mb-3
                                   text-ink-mid border border-line bg-white/[0.03]
                                   group-hover:text-accent-soft group-hover:border-accent/30
                                   transition-colors duration-200">
                    {cap.icon}
                  </span>
                  <div className="font-display text-[13.5px] font-medium text-ink mb-1">{cap.title}</div>
                  <div className="text-[12px] text-ink-dim leading-snug">&ldquo;{cap.prompt}&rdquo;</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ---------- Conversation thread ---------- */
          <div className="flex flex-col justify-end flex-1">
            {messages.map(msg => (
              msg.role === 'user' ? (
                <div key={msg.id} className="flex flex-col items-end mb-5 animate-msg-in">
                  <div className="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-panel rounded-br-[6px]
                                  bg-white/[0.07] border border-white/[0.09] backdrop-blur-md
                                  text-[14px] leading-[1.65] text-ink">
                    {msg.content}
                  </div>
                  <span className="mt-1.5 text-[10px] tracking-wide text-ink-faint">{formatTime(new Date(msg.createdAt))}</span>
                </div>
              ) : (
                <div key={msg.id} className="flex gap-3 mb-6 animate-msg-in">
                  <span
                    aria-hidden
                    className="mt-[7px] w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: 'radial-gradient(circle at 35% 30%, #c4b5ff, #7c5cff)',
                      boxShadow: '0 0 8px rgba(124,92,255,0.7)',
                    }}
                  />
                  <div className="min-w-0">
                    <div className="text-[14.5px] leading-[1.7] text-ink/95 whitespace-pre-wrap">{msg.content}</div>
                    <span className="mt-1.5 inline-block text-[10px] tracking-wide text-ink-faint">{formatTime(new Date(msg.createdAt))}</span>
                  </div>
                </div>
              )
            ))}

            {/* Live interim transcript */}
            {interimTranscript && (
              <div className="flex justify-end mb-5">
                <div className="max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-panel rounded-br-[6px]
                                bg-white/[0.035] border border-white/[0.06] backdrop-blur-md
                                text-[14px] leading-[1.65] text-ink-mid italic">
                  {interimTranscript}
                  <span className="inline-block w-[2px] h-[1em] ml-1 align-middle bg-accent-soft animate-pulse" />
                </div>
              </div>
            )}

            {/* Thinking */}
            {state === 'processing' && (
              <div className="flex gap-3 mb-6 animate-msg-in" role="status" aria-label="Connection is thinking">
                <span
                  aria-hidden
                  className="mt-[7px] w-2 h-2 rounded-full shrink-0"
                  style={{ background: '#4cc9f0', boxShadow: '0 0 10px rgba(76,201,240,0.8)' }}
                />
                <div className="flex items-center gap-1.5 h-6">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-ink-dim inline-block"
                      style={{ animation: `thinking-dot 1.2s ease-in-out ${i * 0.18}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 mx-auto px-4 py-2 rounded-card text-[12.5px] text-[#ff9a9a]
                              bg-[#ff5c5c]/[0.07] border border-[#ff5c5c]/[0.18]" role="alert">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
