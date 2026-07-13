import { executeTool, openaiToolDefinitions } from '@/lib/tools'

describe('openaiToolDefinitions', () => {
  it('defines required tools', () => {
    const names = openaiToolDefinitions.map((t) => (t as { function: { name: string } }).function.name)
    expect(names).toContain('web_search')
    expect(names).toContain('get_current_time')
    expect(names).toContain('add_todo')
    expect(names).toContain('list_todos')
    expect(names).toContain('get_calendar_events')
  })

  it('each tool has type function and parameters', () => {
    for (const tool of openaiToolDefinitions) {
      expect(tool.type).toBe('function')
      expect((tool as { function: { parameters: unknown } }).function.parameters).toBeDefined()
    }
  })
})

describe('executeTool', () => {
  it('get_current_time returns formatted date', async () => {
    const result = await executeTool('get_current_time', {})
    expect(result).toMatch(/Current date and time/)
  })

  it('add_todo stores task and confirms', async () => {
    const result = await executeTool('add_todo', { task: 'Buy groceries' })
    expect(result).toContain('Buy groceries')
    expect(result).toContain('Added to-do')
  })

  it('list_todos shows added task', async () => {
    await executeTool('add_todo', { task: 'Test task for listing' })
    const result = await executeTool('list_todos', {})
    expect(result).toContain('Test task for listing')
  })

  it('web_search falls back gracefully without an API key', async () => {
    const result = await executeTool('web_search', { query: 'latest news' })
    expect(result).toContain('latest news')
    expect(result).toContain('unavailable')
  })

  it('unknown tool returns error message', async () => {
    const result = await executeTool('nonexistent_tool', {})
    expect(result).toContain('Unknown tool')
  })
})
