import type OpenAI from 'openai'

// -- ANTHROPIC tool definitions (re-enable with Anthropic client) --
// import type Anthropic from '@anthropic-ai/sdk'
// export const toolDefinitions: Anthropic.Tool[] = [ ... ]

export const openaiToolDefinitions: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web for current information, news, or facts.',
      parameters: { type: 'object', properties: { query: { type: 'string', description: 'The search query' } }, required: ['query'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the current date and time.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_todo',
      description: "Add a to-do item or reminder to the user's list.",
      parameters: { type: 'object', properties: { task: { type: 'string', description: 'The task text' }, dueDate: { type: 'string', description: 'Optional due date in ISO format' } }, required: ['task'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_todos',
      description: "List the user's current to-do items.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_calendar_events',
      description: 'Get upcoming calendar events.',
      parameters: { type: 'object', properties: { startDate: { type: 'string' }, days: { type: 'number' } }, required: [] },
    },
  },
]

// -- ANTHROPIC format (kept for re-enable) --
export const toolDefinitions = [
  {
    name: 'web_search',
    description: 'Search the web for current information, news, or facts.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'The search query' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_current_time',
    description: 'Get the current date and time.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'add_todo',
    description: 'Add a to-do item or reminder to the user\'s list.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task: { type: 'string', description: 'The task or reminder text' },
        dueDate: { type: 'string', description: 'Optional due date in ISO format' },
      },
      required: ['task'],
    },
  },
  {
    name: 'list_todos',
    description: 'List the user\'s current to-do items.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_calendar_events',
    description: 'Get upcoming calendar events for a date range.',
    input_schema: {
      type: 'object' as const,
      properties: {
        startDate: { type: 'string', description: 'Start date in ISO format (defaults to today)' },
        days: { type: 'number', description: 'Number of days to look ahead (default 7)' },
      },
      required: [],
    },
  },
]

interface TodoItem {
  id: string
  task: string
  dueDate?: string
  createdAt: string
  completed: boolean
}

const todoStore: TodoItem[] = []

/** Live web search via Gemini's Google Search grounding (runs server-side). */
async function searchWeb(query: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return `Web search is not configured, so no live results for "${query}". Answer from your own knowledge and say the search was unavailable.`
  }
  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: query }] }],
          tools: [{ google_search: {} }],
        }),
      }
    )
    if (!res.ok) throw new Error(`grounding request failed: ${res.status}`)
    const data = await res.json()
    const parts: Array<{ text?: string }> = data.candidates?.[0]?.content?.parts ?? []
    const answer = parts.map(p => p.text ?? '').join('').trim()
    if (!answer) throw new Error('empty grounding response')
    const chunks: Array<{ web?: { uri?: string; title?: string } }> =
      data.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
    const sources = chunks
      .map(c => c.web?.title || c.web?.uri)
      .filter(Boolean)
      .slice(0, 3)
    return sources.length ? `${answer}\n\nSources: ${sources.join(', ')}` : answer
  } catch {
    return `Web search failed for "${query}" — answer from your own knowledge and say the search was unavailable.`
  }
}

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case 'web_search': {
      const query = toolInput.query as string
      return searchWeb(query)
    }

    case 'get_current_time': {
      const now = new Date()
      return `Current date and time: ${now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })}`
    }

    case 'add_todo': {
      const task = toolInput.task as string
      const dueDate = toolInput.dueDate as string | undefined
      const item: TodoItem = {
        id: Date.now().toString(),
        task,
        dueDate,
        createdAt: new Date().toISOString(),
        completed: false,
      }
      todoStore.push(item)
      return `Added to-do: "${task}"${dueDate ? ` due ${dueDate}` : ''}`
    }

    case 'list_todos': {
      const pending = todoStore.filter((t) => !t.completed)
      if (pending.length === 0) return 'Your to-do list is empty.'
      return `Your to-dos:\n${pending.map((t, i) => `${i + 1}. ${t.task}${t.dueDate ? ` (due ${t.dueDate})` : ''}`).join('\n')}`
    }

    case 'get_calendar_events': {
      return 'Calendar integration requires connecting a Google or Apple Calendar account. This demo returns sample events: Team standup tomorrow 9am, Project review Friday 2pm.'
    }

    default:
      return `Unknown tool: ${toolName}`
  }
}
