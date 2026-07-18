jest.mock('@/lib/anthropic', () => ({
  getClient: () => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ finish_reason: 'stop', message: { content: 'Hello! How can I help you?', tool_calls: null } }],
        }),
      },
    },
  }),
  MODEL: 'deepseek-chat',
  MAX_TOKENS: 1024,
  SYSTEM_PROMPT: 'You are a helpful voice assistant.',
}))

import { MODEL, SYSTEM_PROMPT, getClient } from '@/lib/anthropic'
import { executeTool, openaiToolDefinitions } from '@/lib/tools'
import { MAX_AGENT_STEPS, MAX_MESSAGE_CHARS } from '@/lib/limits'

describe('LLM config', () => {
  it('bounds public demo input and agent work', () => {
    expect(MAX_MESSAGE_CHARS).toBeLessThanOrEqual(2000)
    expect(MAX_AGENT_STEPS).toBeLessThanOrEqual(8)
  })
  it('exports MODEL string', () => {
    expect(typeof MODEL).toBe('string')
    expect(MODEL.length).toBeGreaterThan(0)
  })

  it('exports non-empty SYSTEM_PROMPT', () => {
    expect(SYSTEM_PROMPT.length).toBeGreaterThan(0)
  })

  it('getClient().chat.completions.create is callable', async () => {
    const client = getClient()
    const result = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: 'hi' }],
    } as Parameters<typeof client.chat.completions.create>[0]) as { choices: Array<{ message: { content: string } }> }
    expect(result.choices[0].message.content).toBe('Hello! How can I help you?')
  })
})

describe('openai tool definitions', () => {
  it('defines required tools', () => {
    const names = openaiToolDefinitions.map((t) => (t as { function: { name: string } }).function.name)
    expect(names).toContain('web_search')
    expect(names).toContain('get_current_time')
    expect(names).toContain('add_todo')
  })

  it('each tool has function type', () => {
    for (const tool of openaiToolDefinitions) {
      expect(tool.type).toBe('function')
    }
  })
})

describe('tool execution integration', () => {
  it('get_current_time returns string', async () => {
    const result = await executeTool('get_current_time', {})
    expect(typeof result).toBe('string')
  })

  it('add_todo + list_todos round-trip', async () => {
    await executeTool('add_todo', { task: 'Roundtrip test task' })
    const list = await executeTool('list_todos', {})
    expect(list).toContain('Roundtrip test task')
  })
})
