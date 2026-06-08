import { useState, useCallback, useRef } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

export function useSpeechRecognition(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [supported] = useState(() => !!SR)
  const recognizerRef = useRef<InstanceType<typeof SR> | null>(null)

  const start = useCallback(() => {
    if (!supported) return
    const r = new SR()
    r.lang = 'de-DE'
    r.continuous = false
    r.interimResults = false
    r.maxAlternatives = 1

    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = (e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      const text = e.results[0][0].transcript
      onResult(text)
    }
    r.onerror = () => setListening(false)

    r.start()
    recognizerRef.current = r
  }, [supported, onResult])

  const stop = useCallback(() => {
    recognizerRef.current?.stop()
    setListening(false)
  }, [])

  return { start, stop, listening, supported }
}
