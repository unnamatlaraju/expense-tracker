"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/** Minimal typing for the Web Speech API (not in TypeScript's DOM lib). */
interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

const getRecognitionCtor = (): SpeechRecognitionCtor | null => {
  if (typeof window === "undefined") return null
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access was blocked. Allow it in your browser settings.",
  "service-not-allowed": "Speech recognition is blocked in this browser.",
  "no-speech": "I didn't hear anything. Tap the mic and try again.",
  "audio-capture": "No microphone was found.",
  network: "Speech recognition needs an internet connection.",
}

/**
 * Wraps the browser's speech-to-text. `onFinal` fires once with the whole
 * sentence when the user stops talking (or presses stop).
 */
export function useSpeechRecognition({ lang = "en-IN", onFinal }: { lang?: string; onFinal: (text: string) => void }) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState("")
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const finalRef = useRef("")
  const onFinalRef = useRef(onFinal)
  onFinalRef.current = onFinal

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null)
    return () => recognitionRef.current?.abort()
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    recognitionRef.current?.abort()
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = true
    finalRef.current = ""
    setTranscript("")
    setError("")

    recognition.onresult = (event) => {
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalRef.current += result[0].transcript
        else interim += result[0].transcript
      }
      setTranscript((finalRef.current + interim).trim())
    }
    recognition.onerror = (event) => {
      if (event.error !== "aborted") setError(ERROR_MESSAGES[event.error] ?? "Something went wrong. Try again.")
    }
    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
      const text = finalRef.current.trim()
      if (text) onFinalRef.current(text)
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [lang])

  const stop = useCallback(() => recognitionRef.current?.stop(), [])

  return { supported, listening, transcript, error, start, stop }
}
