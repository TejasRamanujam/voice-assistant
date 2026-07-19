import { NextRequest, NextResponse } from 'next/server'
import type OpenAI from 'openai'
import { getClient, MAX_TOKENS, MODEL, SYSTEM_PROMPT } from '@/lib/anthropic'
import { executeTool, openaiToolDefinitions } from '@/lib/tools'
import {
  CHAT_STREAM_TIMEOUT_MS,
  MAX_AGENT_STEPS,
  MAX_MESSAGE_CHARS,
  MAX_TOOL_CALLS_PER_STEP,
  RATE_LIMITS,
} from '@/lib/limits'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

type Message = OpenAI.ChatCompletionMessageParam
type ToolReceipt = { toolName: string; result: string }
type StreamToolCall = {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

function receipt(result: string) {
  return result.replace(/\s+/g, ' ').slice(0, 420)
}

function ndjson(value: object) {
  return `${JSON.stringify(value)}\n`
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers)
    const quota = checkRateLimit(`chat:${ip}`, RATE_LIMITS.chat.limit, RATE_LIMITS.chat.windowMs)
    if (!quota.allowed) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(quota.retryAfter) } }
      )
    }

    const contentLength = Number(req.headers.get('content-length') || 0)
    if (contentLength > 16 * 1024) {
      return NextResponse.json({ error: 'Request body is too large' }, { status: 413 })
    }

    const body = await req.json()
    const message = typeof body?.message === 'string' ? body.message.trim() : ''

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        { error: `Message must be ${MAX_MESSAGE_CHARS} characters or fewer` },
        { status: 413 }
      )
    }

    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ]
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: object) => controller.enqueue(encoder.encode(ndjson(event)))

        try {
          let responseText = ''
          const toolResults: ToolReceipt[] = []

          // Tool-call turns stay internal; only the final answer is streamed.
          for (let step = 0; step < MAX_AGENT_STEPS; step += 1) {
            const completion = await getClient().chat.completions.create(
              {
                model: MODEL,
                max_tokens: MAX_TOKENS,
                tools: openaiToolDefinitions,
                messages,
                stream: true,
              },
              { signal: AbortSignal.timeout(CHAT_STREAM_TIMEOUT_MS) }
            )
            const toolCalls = new Map<number, StreamToolCall>()
            let finishReason: string | null = null

            for await (const chunk of completion) {
              const choice = chunk.choices[0]
              if (!choice) continue
              finishReason = choice.finish_reason ?? finishReason

              if (choice.delta.content) {
                responseText += choice.delta.content
                send({ type: 'delta', text: choice.delta.content })
              }

              for (const fragment of choice.delta.tool_calls ?? []) {
                const current = toolCalls.get(fragment.index) ?? {
                  id: '',
                  type: 'function' as const,
                  function: { name: '', arguments: '' },
                }
                if (fragment.id) current.id += fragment.id
                if (fragment.function?.name) current.function.name += fragment.function.name
                if (fragment.function?.arguments) {
                  current.function.arguments += fragment.function.arguments
                }
                toolCalls.set(fragment.index, current)
              }
            }

            if (finishReason === 'tool_calls' && toolCalls.size) {
              if (toolCalls.size > MAX_TOOL_CALLS_PER_STEP) {
                send({ type: 'error', error: 'tool_budget_exceeded' })
                return
              }

              const calls = [...toolCalls.entries()]
                .sort(([left], [right]) => left - right)
                .map(([, call]) => call)
              messages.push({ role: 'assistant', content: null, tool_calls: calls })

              for (const toolCall of calls) {
                send({ type: 'tool', name: toolCall.function.name })
                const result = await executeTool(
                  toolCall.function.name,
                  JSON.parse(toolCall.function.arguments || '{}')
                )
                toolResults.push({
                  toolName: toolCall.function.name,
                  result: receipt(result),
                })
                messages.push({
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: result,
                })
              }
              continue
            }

            if (responseText) {
              send({ type: 'done', conversationId: null, toolResults })
              return
            }
            break
          }

          send({ type: 'error', error: 'agent_loop_exceeded' })
        } catch (error) {
          console.error('Chat stream error:', error)
          const status = (error as { status?: number })?.status
          send({ type: 'error', error: status === 429 ? 'rate_limited' : 'failed' })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    const status = (error as { status?: number })?.status
    if (status === 429) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
