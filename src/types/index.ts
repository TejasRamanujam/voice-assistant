export type Role = 'user' | 'assistant'

export interface Message {
  id: string
  role: Role
  content: string
  createdAt: Date
  tools?: ToolResult[]
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking'

export interface UserPreferences {
  voiceName: string
  voiceRate: number
  voicePitch: number
  wakeWordEnabled: boolean
  wakeWord: string
  ttsProvider: 'browser' | 'openai' | 'elevenlabs'
}

export interface ToolResult {
  toolName: string
  result: string
}
