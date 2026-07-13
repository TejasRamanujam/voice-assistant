import { render, screen, fireEvent } from '@testing-library/react'
import { TransmitBar } from '@/components/TransmitBar'
import { TransmissionLog } from '@/components/TransmissionLog'
import type { Message } from '@/types'

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn()
})

describe('TransmitBar', () => {
  const baseProps = {
    state: 'idle' as const,
    isSupported: true,
    onSubmitText: jest.fn(),
    onVoiceMode: jest.fn(),
  }

  it('renders the voice button when speech is supported', () => {
    render(<TransmitBar {...baseProps} />)
    expect(
      screen.getByRole('button', { name: /open the live voice channel/i })
    ).toBeInTheDocument()
  })

  it('disables the voice button when speech is not supported', () => {
    render(<TransmitBar {...baseProps} isSupported={false} />)
    expect(
      screen.getByRole('button', { name: /voice input not supported/i })
    ).toBeDisabled()
  })

  it('opens voice mode when the voice button is clicked', () => {
    const onVoiceMode = jest.fn()
    render(<TransmitBar {...baseProps} onVoiceMode={onVoiceMode} />)
    fireEvent.click(screen.getByRole('button', { name: /open the live voice channel/i }))
    expect(onVoiceMode).toHaveBeenCalledTimes(1)
  })

  it('submits trimmed text and clears the input', () => {
    const onSubmitText = jest.fn()
    render(<TransmitBar {...baseProps} onSubmitText={onSubmitText} />)
    const input = screen.getByLabelText(/type your transmission/i)
    fireEvent.change(input, { target: { value: '  hello wire  ' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))
    expect(onSubmitText).toHaveBeenCalledWith('hello wire')
    expect(input).toHaveValue('')
  })

  it('disables send when the input is empty', () => {
    render(<TransmitBar {...baseProps} />)
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })

  it('does not submit while processing', () => {
    const onSubmitText = jest.fn()
    render(<TransmitBar {...baseProps} state="processing" onSubmitText={onSubmitText} />)
    const input = screen.getByLabelText(/type your transmission/i)
    fireEvent.change(input, { target: { value: 'hello' } })
    fireEvent.submit(input.closest('form') as HTMLFormElement)
    expect(onSubmitText).not.toHaveBeenCalled()
  })
})

describe('TransmissionLog', () => {
  const baseProps = {
    messages: [] as Message[],
    state: 'idle' as const,
    error: '',
    interimTranscript: '',
    onPrompt: jest.fn(),
  }

  it('shows the empty state when there are no messages', () => {
    render(<TransmissionLog {...baseProps} />)
    expect(screen.getByText(/no transmissions yet/i)).toBeInTheDocument()
  })

  it('fires onPrompt when a suggestion is clicked', () => {
    const onPrompt = jest.fn()
    render(<TransmissionLog {...baseProps} onPrompt={onPrompt} />)
    fireEvent.click(screen.getByText(/what time is it right now\?/i))
    expect(onPrompt).toHaveBeenCalledWith('What time is it right now?')
  })

  it('renders user and assistant messages', () => {
    const messages: Message[] = [
      { id: '1', role: 'user', content: 'Hello there', createdAt: new Date() },
      { id: '2', role: 'assistant', content: 'Hi! How can I help?', createdAt: new Date() },
    ]
    render(<TransmissionLog {...baseProps} messages={messages} />)
    expect(screen.getByText('Hello there')).toBeInTheDocument()
    expect(screen.getByText('Hi! How can I help?')).toBeInTheDocument()
  })

  it('shows the interim transcript while listening', () => {
    render(
      <TransmissionLog {...baseProps} state="listening" interimTranscript="what is the" />
    )
    expect(screen.getByText('what is the')).toBeInTheDocument()
  })

  it('announces processing state', () => {
    render(<TransmissionLog {...baseProps} state="processing" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows errors as an alert', () => {
    render(<TransmissionLog {...baseProps} error="Mic denied" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Mic denied')
  })
})
