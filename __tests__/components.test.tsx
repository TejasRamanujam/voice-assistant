import { render, screen, fireEvent } from '@testing-library/react'
import { MicButton } from '@/components/MicButton'
import { StatusIndicator } from '@/components/StatusIndicator'
import { ChatTranscript } from '@/components/ChatTranscript'
import type { Message } from '@/types'

describe('MicButton', () => {
  it('renders with idle state', () => {
    const onClick = jest.fn()
    render(<MicButton state="idle" onClick={onClick} />)
    const btn = screen.getByRole('button', { name: /start listening/i })
    expect(btn).toBeInTheDocument()
  })

  it('shows listening label when active', () => {
    render(<MicButton state="listening" onClick={jest.fn()} />)
    expect(screen.getByRole('button', { name: /stop listening/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = jest.fn()
    render(<MicButton state="idle" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<MicButton state="idle" onClick={jest.fn()} disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

describe('StatusIndicator', () => {
  it('shows idle message', () => {
    render(<StatusIndicator state="idle" />)
    expect(screen.getByText(/click mic/i)).toBeInTheDocument()
  })

  it('shows error when provided', () => {
    render(<StatusIndicator state="idle" error="Mic denied" />)
    expect(screen.getByText('Mic denied')).toBeInTheDocument()
  })

  it('shows interim transcript', () => {
    render(<StatusIndicator state="listening" interimTranscript="what is the" />)
    expect(screen.getByText('what is the')).toBeInTheDocument()
  })

  it('shows wake word hint when enabled', () => {
    render(
      <StatusIndicator
        state="idle"
        wakeWordEnabled={true}
        wakeWord="hey assistant"
      />
    )
    expect(screen.getByText(/hey assistant/i)).toBeInTheDocument()
  })
})

describe('ChatTranscript', () => {
  it('shows empty state when no messages', () => {
    render(<ChatTranscript messages={[]} />)
    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument()
  })

  it('renders user and assistant messages', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'Hello there', createdAt: new Date() },
      { id: '2', role: 'assistant', content: 'Hi! How can I help?', createdAt: new Date() },
    ]
    render(<ChatTranscript messages={messages} />)
    expect(screen.getByText('Hello there')).toBeInTheDocument()
    expect(screen.getByText('Hi! How can I help?')).toBeInTheDocument()
  })
})
