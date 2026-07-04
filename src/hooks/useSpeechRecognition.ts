'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionOptions {
  onTranscript: (text: string, isFinal: boolean) => void
  onError: (error: string) => void
  language?: string
  continuous?: boolean
}

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isSupported: boolean
  start: () => void
  stop: () => void
  interimTranscript: string
}


export function useSpeechRecognition({
  onTranscript,
  onError,
  language = 'en-US',
  continuous = false,
}: SpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    setIsSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }, [])

  const createRecognition = useCallback(() => {
    if (!isSupported) return null
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = language
    recognition.interimResults = true
    recognition.continuous = continuous
    recognition.maxAlternatives = 1
    return recognition
  }, [isSupported, language, continuous])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const start = useCallback(() => {
    if (!isSupported) {
      onError('Speech recognition is not supported in this browser. Try Chrome or Edge.')
      return
    }

    if (isListening) {
      stop()
      return
    }

    const recognition = createRecognition()
    if (!recognition) return

    recognition.onstart = () => {
      setIsListening(true)
      setInterimTranscript('')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (interim) setInterimTranscript(interim)
      if (final) {
        setInterimTranscript('')
        onTranscript(final.trim(), true)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false)
      setInterimTranscript('')

      switch (event.error) {
        case 'not-allowed':
          onError('Microphone access denied. Please allow microphone permission.')
          break
        case 'no-speech':
          onError('No speech detected. Please try again.')
          break
        case 'network':
          onError('Network error during speech recognition.')
          break
        case 'aborted':
          break
        default:
          onError(`Speech recognition error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch (e) {
      onError(`Failed to start microphone: ${e instanceof Error ? e.message : String(e)}`)
    }
  }, [isSupported, isListening, createRecognition, stop, onTranscript, onError])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  return { isListening, isSupported, start, stop, interimTranscript }
}
