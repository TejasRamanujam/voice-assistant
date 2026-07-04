import { NextRequest, NextResponse } from 'next/server'
import type OpenAI from 'openai'
import { client, MAX_TOKENS, MODEL, SYSTEM_PROMPT } from '@/lib/anthropic'
import { executeTool, openaiToolDefinitions } from '@/lib/tools'

// -- NEXTAUTH/PERSISTENCE (re-enable with NextAuth) --
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
// import { prisma } from '@/lib/prisma'

type Message = OpenAI.ChatCompletionMessageParam

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // -- NEXTAUTH (re-enable with NextAuth) --
    // const session = await getServerSession(authOptions)
    // const userId = session?.user?.id

    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ]

    let responseText = ''

    // Agentic loop — handles tool calls until end_turn
    while (true) {
      const response = await client.chat.completions.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        tools: openaiToolDefinitions,
        messages,
      })

      const choice = response.choices[0]

      if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls?.length) {
        messages.push(choice.message)

        for (const toolCall of choice.message.tool_calls) {
          if (toolCall.type !== 'function') continue
          const fn = (toolCall as { id: string; type: 'function'; function: { name: string; arguments: string } }).function
          const result = await executeTool(
            fn.name,
            JSON.parse(fn.arguments || '{}')
          )
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

    // -- PERSISTENCE (re-enable with NextAuth) --
    // if (userId) {
    //   const conv = await prisma.conversation.create({ data: { userId, title: message.slice(0, 50) } })
    //   await prisma.message.createMany({ data: [
    //     { conversationId: conv.id, role: 'user', content: message },
    //     { conversationId: conv.id, role: 'assistant', content: responseText },
    //   ]})
    // }

    return NextResponse.json({ response: responseText, conversationId: null })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
