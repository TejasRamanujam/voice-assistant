import { NextRequest, NextResponse } from 'next/server'
import type OpenAI from 'openai'
import { getClient, MAX_TOKENS, MODEL, SYSTEM_PROMPT } from '@/lib/anthropic'
import { executeTool, openaiToolDefinitions } from '@/lib/tools'
import {
  MAX_AGENT_STEPS,
  MAX_MESSAGE_CHARS,
  MAX_TOOL_CALLS_PER_STEP,
  RATE_LIMITS,
} from '@/lib/limits'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// -- NEXTAUTH/PERSISTENCE (re-enable with NextAuth) --
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
// import { prisma } from '@/lib/prisma'

type Message = OpenAI.ChatCompletionMessageParam
type ToolReceipt = { toolName: string; result: string }

function receipt(result: string) {
  return result.replace(/\s+/g, ' ').slice(0, 180)
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

    // -- NEXTAUTH (re-enable with NextAuth) --
    // const session = await getServerSession(authOptions)
    // const userId = session?.user?.id

    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ]

    let responseText = ''
    const toolResults: ToolReceipt[] = []

    // Agentic loop — handles tool calls until end_turn
    for (let step = 0; step < MAX_AGENT_STEPS; step += 1) {
      const response = await getClient().chat.completions.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        tools: openaiToolDefinitions,
        messages,
      })

      const choice = response.choices[0]

      if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls?.length) {
        if (choice.message.tool_calls.length > MAX_TOOL_CALLS_PER_STEP) {
          return NextResponse.json({ error: 'tool_budget_exceeded' }, { status: 502 })
        }
        messages.push(choice.message)

        for (const toolCall of choice.message.tool_calls) {
          if (toolCall.type !== 'function') continue
          const fn = (toolCall as { id: string; type: 'function'; function: { name: string; arguments: string } }).function
          const result = await executeTool(
            fn.name,
            JSON.parse(fn.arguments || '{}')
          )
          toolResults.push({ toolName: fn.name, result: receipt(result) })
          messages.push({
            role: 'tool',
            tool_call_id: (toolCall as { id: string }).id,
            content: result,
          })
        }
        continue
      }

      responseText = choice.message.content ?? ''
      break
    }

    if (!responseText) {
      return NextResponse.json({ error: 'agent_loop_exceeded' }, { status: 502 })
    }

    // -- PERSISTENCE (re-enable with NextAuth) --
    // if (userId) {
    //   const conv = await prisma.conversation.create({ data: { userId, title: message.slice(0, 50) } })
    //   await prisma.message.createMany({ data: [
    //     { conversationId: conv.id, role: 'user', content: message },
    //     { conversationId: conv.id, role: 'assistant', content: responseText },
    //   ]})
    // }

    return NextResponse.json({ response: responseText, conversationId: null, toolResults })
  } catch (error) {
    console.error('Chat error:', error)
    // Surface upstream rate limiting so the UI can say something honest.
    const status = (error as { status?: number })?.status
    if (status === 429) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
