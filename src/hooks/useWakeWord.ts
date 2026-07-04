'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSpeechRecognition } from './useSpeechRecognition'

interface UseWakeWordOptions {
  wakeWord: string
  enabled: boolean
  onDetected: () => void
}

export function useWakeWord({ wakeWord, enabled, onDetected }: UseWakeWordOptions) {
  const [isWatching, setIsWatching] = useState(false)
  const onDetectedRef = useRef(onDetected)
  const startRef = useRef<(() => void) | null>(null)
  const isWatchingRef = useRef(isWatching)
  onDetectedRef.current = onDetected
  isWatchingRef.current = isWatching

  const normalizedWake = wakeWord.toLowerCase().trim()

  const { isListening, isSupported, start, stop } = useSpeechRecognition({
    continuous: true,
    onTranscript: useCallback(
      (text: string) => {
        if (text.toLowerCase().includes(normalizedWake)) {
          onDetectedRef.current()
        }
      },
      [normalizedWake]
    ),
    onError: useCallback(() => {
      setTimeout(() => {
        if (isWatchingRef.current && startRef.current) {
          startRef.current()
        }
      }, 2000)
    }, []),
  })

  // Keep startRef in sync
  useEffect(() => {
    startRef.current = start
  }, [start])

  useEffect(() => {
    if (enabled && !isListening && isSupported) {
      setIsWatching(true)
      start()
    } else if (!enabled) {
      setIsWatching(false)
      stop()
    }
  }, [enabled, isSupported]) // eslint-disable-line react-hooks/exhaustive-deps

  return { isWatching, isSupported }
}
