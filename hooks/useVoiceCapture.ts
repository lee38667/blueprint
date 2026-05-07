import { useCallback, useMemo, useRef, useState } from 'react'

declare global {
  interface Window {
    SpeechRecognition?: any
    webkitSpeechRecognition?: any
  }
}

export function useVoiceCapture(onTranscript?: (text: string) => void) {
  const recognitionRef = useRef<any>(null)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supported = useMemo(() => {
    if (typeof window === 'undefined') return false
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop?.()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    if (!supported || typeof window === 'undefined') {
      setError('Voice input is not supported in this browser.')
      return
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setError(null)
      setListening(true)
    }

    recognition.onerror = (event: any) => {
      setError(event?.error === 'not-allowed' ? 'Microphone permission was denied.' : 'Voice input failed.')
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript?.trim()
      if (transcript) {
        onTranscript?.(transcript)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [onTranscript, supported])

  return {
    supported,
    listening,
    error,
    start,
    stop,
  }
}

export default useVoiceCapture
