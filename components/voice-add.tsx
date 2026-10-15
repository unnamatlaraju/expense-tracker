"use client"

import { Check, CircleAlert, Keyboard, Loader2, Mic, Pencil, Sparkles, Square, X } from "lucide-react"
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react"
import { useMicrophone, VoiceBeam, type VoiceBeamMotion } from "voice-glow"
import { CategoryIcon } from "@/components/category-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate, toISODate } from "@/lib/format"
import { useExpenseStore } from "@/lib/store"
import { useSpeechRecognition } from "@/lib/use-speech-recognition"
import { cn } from "@/lib/utils"
import { parseVoiceExpense } from "@/lib/voice-parse"

export interface VoiceDraft {
  amount: number | null
  description: string
  category: string
  date: string
}

type Phase = "idle" | "listening" | "thinking" | "review"

const AURORA_LOBES = ["#f0abfc", "#a855f7", "#ec4899", "#22d3ee", "#f97316", "#818cf8", "#fb7185"]
const EXAMPLES = ["I spent 1000 on rent", "200 for snacks yesterday", "Auto to college 80 rupees"]
const THINKING_MS = 900

const daysAgoToISO = (daysAgo: number) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return toISODate(date)
}

export function VoiceAdd({ onEdit }: { onEdit: (draft: VoiceDraft) => void }) {
  const { categories, addExpense } = useExpenseStore()
  const mic = useMicrophone({ constraints: {} })
  const [phase, setPhase] = useState<Phase>("idle")
  const [heard, setHeard] = useState("")
  const [typed, setTyped] = useState("")
  const [showTyping, setShowTyping] = useState(false)
  const [draft, setDraft] = useState<VoiceDraft | null>(null)
  const [added, setAdded] = useState("")
  const phaseRef = useRef<Phase>("idle")
  phaseRef.current = phase
  const thinkingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const understand = useCallback(
    (text: string) => {
      setHeard(text)
      setPhase("thinking")
      setAdded("")
      thinkingTimer.current = setTimeout(() => {
        const parsed = parseVoiceExpense(text, categories)
        setDraft({
          amount: parsed.amount,
          description: parsed.description,
          category: parsed.category,
          date: daysAgoToISO(parsed.daysAgo),
        })
        setPhase("review")
      }, THINKING_MS)
    },
    [categories],
  )

  const speech = useSpeechRecognition({ onFinal: understand })
  const stopMic = mic.stop

  useEffect(() => {
    if (!speech.listening && phaseRef.current === "listening") {
      stopMic()
      setPhase("idle")
    }
  }, [speech.listening, stopMic])

  useEffect(() => {
    if (phase !== "listening") stopMic()
  }, [phase, stopMic])

  useEffect(() => () => {
    if (thinkingTimer.current) clearTimeout(thinkingTimer.current)
  }, [])

  const startListening = () => {
    setDraft(null)
    setAdded("")
    setHeard("")
    setPhase("listening")
    void mic.start()
    speech.start()
  }

  const stopListening = () => speech.stop()

  const submitTyped = (event: FormEvent) => {
    event.preventDefault()
    if (!typed.trim()) return
    understand(typed.trim())
    setTyped("")
  }

  const reset = () => {
    setDraft(null)
    setPhase("idle")
  }

  const confirm = () => {
    if (!draft?.amount) return
    addExpense({ description: draft.description, amount: draft.amount, category: draft.category, date: draft.date })
    setAdded(`${formatCurrency(draft.amount)} · ${draft.category}`)
    reset()
  }

  const motion = useCallback((): VoiceBeamMotion | null => {
    if (phaseRef.current !== "thinking") return null
    const t = performance.now() / 1000
    return { gather: 1, offset: Math.sin(t * 2.6) * 0.8, stretch: 0.4, heldLevel: 0.6 }
  }, [])

  const fallbackLevel = useCallback(() => {
    if (phaseRef.current !== "listening") return 0
    return 0.35 + Math.sin(performance.now() / 180) * 0.15
  }, [])

  const listening = phase === "listening"
  const thinking = phase === "thinking"
  const errorMessage = speech.error || (mic.state === "denied" && !speech.listening ? "Microphone access was blocked." : "")

  return (
    <section aria-label="Add by voice" className="space-y-3">
      <VoiceBeam
        stream={listening ? mic.stream : null}
        level={fallbackLevel}
        motion={motion}
        theme="dark"
        colors={AURORA_LOBES}
        bandColors={{ core: "#fdf4ff", above: "#f472b6", mid: "#c084fc", below: "#22d3ee" }}
        idle={0.15}
        sensitivity={1.6}
        className="w-full"
      >
        <div className="glass relative overflow-hidden rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              disabled={!speech.supported || thinking}
              aria-pressed={listening}
              aria-label={listening ? "Stop listening" : "Add expense by voice"}
              className={cn(
                "bg-aurora glow relative grid size-14 shrink-0 cursor-pointer place-items-center rounded-2xl text-white transition-transform duration-300 ease-out-expo outline-none hover:scale-105 focus-visible:ring-4 focus-visible:ring-primary/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
                listening && "scale-105",
              )}
            >
              {listening && <span aria-hidden className="absolute inset-0 animate-ping rounded-2xl bg-[#ec4899]/40" />}
              {thinking ? <Loader2 className="size-6 animate-spin" /> : listening ? <Square className="size-5 fill-current" /> : <Mic className="size-6" />}
            </button>
            <div className="min-w-0 flex-1" aria-live="polite">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="size-3.5 text-[#f0abfc]" />
                {listening ? "Listening…" : thinking ? "Understanding…" : "Just say it"}
              </p>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {listening
                  ? speech.transcript || "Try: “I spent 1000 on rent”"
                  : thinking
                    ? `“${heard}”`
                    : speech.supported
                      ? "Tap the mic and say what you spent."
                      : "Voice works in Chrome, Edge and Safari. You can type it instead."}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Type instead"
              aria-expanded={showTyping}
              onClick={() => setShowTyping((v) => !v)}
              className="shrink-0 text-muted-foreground"
            >
              <Keyboard />
            </Button>
          </div>

          {(showTyping || !speech.supported) && (
            <form onSubmit={submitTyped} className="animate-rise-in mt-4 flex gap-2">
              <Input
                aria-label="Describe your expense"
                placeholder="e.g. spent 200 on snacks"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
              />
              <Button type="submit" variant="outline" className="h-11" disabled={!typed.trim() || thinking}>
                Go
              </Button>
            </form>
          )}

          {phase === "idle" && !added && !showTyping && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => understand(example)}
                  className="cursor-pointer rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-muted-foreground transition-colors duration-300 hover:border-white/25 hover:text-foreground"
                >
                  “{example}”
                </button>
              ))}
            </div>
          )}
        </div>
      </VoiceBeam>

      {errorMessage && phase === "idle" && (
        <p role="alert" className="animate-rise-in flex items-center gap-2 px-1 text-sm text-destructive">
          <CircleAlert className="size-4 shrink-0" />
          {errorMessage}
        </p>
      )}

      {added && (
        <p role="status" className="animate-rise-in flex items-center gap-2 px-1 text-sm text-[#6ee7b7]">
          <Check className="size-4 shrink-0" />
          Added {added}
        </p>
      )}

      {phase === "review" && draft && (
        <div className="glass animate-rise-in space-y-4 rounded-3xl p-5" aria-label="Check your expense">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">I heard</p>
              <p className="mt-0.5 text-sm break-words italic">“{heard}”</p>
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="Discard" onClick={reset} className="-mt-1 -mr-2 shrink-0">
              <X />
            </Button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <CategoryIcon category={draft.category} className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{draft.description}</p>
              <p className="truncate text-xs text-muted-foreground">
                {draft.category} · {formatDate(draft.date)}
              </p>
            </div>
            <p className={cn("text-xl font-bold tabular-nums", draft.amount ? "text-aurora" : "text-destructive")}>
              {draft.amount ? formatCurrency(draft.amount) : "₹ ?"}
            </p>
          </div>

          {!draft.amount && (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <CircleAlert className="size-4 shrink-0" />
              I couldn&apos;t catch the amount. Try again or edit it in the form.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => { onEdit(draft); reset() }}>
              <Pencil /> Edit
            </Button>
            <Button type="button" onClick={confirm} disabled={!draft.amount}>
              <Check /> Add it
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
