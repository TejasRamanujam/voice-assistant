/** @jest-environment node */

const mockCreate = jest.fn()
const mockExecuteTool = jest.fn()

jest.mock('@/lib/anthropic', () => ({
  getClient: () => ({ chat: { completions: { create: mockCreate } } }),
  MODEL: 'gemini-test',
  MAX_TOKENS: 256,
  SYSTEM_PROMPT: 'Test prompt',
}))

jest.mock('@/lib/tools', () => ({
  executeTool: (...args: unknown[]) => mockExecuteTool(...args),
  openaiToolDefinitions: [],
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import { resetRateLimitsForTests } from '@/lib/rate-limit'

function streamOf(...chunks: object[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) yield chunk
    },
  }
}

function request(message: string, ip: string) {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
    body: JSON.stringify({ message }),
  })
}

function events(body: string) {
  return body.trim().split('\n').map(line => JSON.parse(line))
}

describe('streaming chat route', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockExecuteTool.mockReset()
    resetRateLimitsForTests()
  })

  it('streams answer deltas followed by done', async () => {
    mockCreate.mockResolvedValue(streamOf(
      { choices: [{ delta: { content: 'Hello' }, finish_reason: null }] },
      { choices: [{ delta: { content: ' there' }, finish_reason: null }] },
      { choices: [{ delta: {}, finish_reason: 'stop' }] },
    ))

    const response = await POST(request('hi', '203.0.113.1'))

    expect(response.headers.get('content-type')).toContain('application/x-ndjson')
    expect(events(await response.text())).toEqual([
      { type: 'delta', text: 'Hello' },
      { type: 'delta', text: ' there' },
      { type: 'done', conversationId: null, toolResults: [] },
    ])
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ stream: true }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    )
  })

  it('reassembles tool-call fragments and continues to the final answer', async () => {
    mockCreate
      .mockResolvedValueOnce(streamOf(
        {
          choices: [{
            delta: {
              tool_calls: [{ index: 0, id: 'call_', function: { name: 'get_', arguments: '{"city"' } }],
            },
            finish_reason: null,
          }],
        },
        {
          choices: [{
            delta: {
              tool_calls: [{ index: 0, id: '1', function: { name: 'weather', arguments: ':"Austin"}' } }],
            },
            finish_reason: 'tool_calls',
          }],
        },
      ))
      .mockResolvedValueOnce(streamOf(
        { choices: [{ delta: { content: 'Sunny.' }, finish_reason: null }] },
        { choices: [{ delta: {}, finish_reason: 'stop' }] },
      ))
    mockExecuteTool.mockResolvedValue('72 F and sunny')

    const response = await POST(request('weather?', '203.0.113.2'))
    const bodyEvents = events(await response.text())

    expect(mockExecuteTool).toHaveBeenCalledWith('get_weather', { city: 'Austin' })
    expect(bodyEvents).toEqual([
      { type: 'tool', name: 'get_weather' },
      { type: 'delta', text: 'Sunny.' },
      {
        type: 'done',
        conversationId: null,
        toolResults: [{ toolName: 'get_weather', result: '72 F and sunny' }],
      },
    ])
  })

  it('preserves grounded sources in a capped tool receipt', async () => {
    mockCreate
      .mockResolvedValueOnce(streamOf(
        {
          choices: [{
            delta: {
              tool_calls: [{ index: 0, id: 'call_1', function: { name: 'web_search', arguments: '{"query":"news"}' } }],
            },
            finish_reason: 'tool_calls',
          }],
        },
      ))
      .mockResolvedValueOnce(streamOf(
        { choices: [{ delta: { content: 'Summary.' }, finish_reason: 'stop' }] },
      ))
    mockExecuteTool.mockResolvedValue(
      `${'A'.repeat(600)}\n\nSources:\nExample — https://example.com/report`
    )

    const response = await POST(request('news?', '203.0.113.3'))
    const done = events(await response.text()).find((event) => event.type === 'done')

    expect(done.toolResults[0].result).toContain('Sources: Example — https://example.com/report')
    expect(done.toolResults[0].result.length).toBeLessThanOrEqual(720)
  })
})
