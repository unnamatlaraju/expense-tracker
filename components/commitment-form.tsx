"use client"

import { CircleAlert, Plus, Save } from "lucide-react"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KIND_LABELS } from "@/lib/commitments"
import { todayISO } from "@/lib/format"
import type { Commitment, CommitmentKind, Frequency, NewCommitment } from "@/lib/types"

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
  { value: "yearly", label: "Every year" },
]

const KINDS: CommitmentKind[] = ["bill", "emi", "subscription", "other"]

/**
 * One form for both creating and editing. Passing `commitment` seeds the fields
 * and switches the labels; mount it with a `key` so switching rows re-seeds it.
 */
export function CommitmentForm({
  categories,
  commitment,
  onSubmit,
  onCancel,
}: {
  categories: string[]
  commitment?: Commitment
  onSubmit: (values: NewCommitment) => void
  onCancel?: () => void
}) {
  const editing = Boolean(commitment)
  const [description, setDescription] = useState(commitment?.description ?? "")
  const [amount, setAmount] = useState(commitment ? String(commitment.amount) : "")
  const [category, setCategory] = useState(commitment?.category ?? categories[0] ?? "Others")
  const [frequency, setFrequency] = useState<Frequency>(commitment?.frequency ?? "monthly")
  const [kind, setKind] = useState<CommitmentKind>(commitment?.kind ?? "bill")
  const [nextDue, setNextDue] = useState(commitment?.nextDue ?? todayISO())
  const [remindDaysBefore, setRemindDaysBefore] = useState(String(commitment?.remindDaysBefore ?? 3))
  const [remindersEnabled, setRemindersEnabled] = useState(commitment?.remindersEnabled ?? true)
  const [endDate, setEndDate] = useState(commitment?.endDate ?? "")
  const [autopay, setAutopay] = useState(commitment?.autopay ?? false)
  const [notes, setNotes] = useState(commitment?.notes ?? "")
  const [error, setError] = useState("")

  const submit = (event: FormEvent) => {
    event.preventDefault()

    const value = Number.parseFloat(amount)
    if (!Number.isFinite(value) || value <= 0) return setError("Enter an amount greater than 0.")
    if (!description.trim()) return setError("Add a short description, e.g. “Rent”.")
    if (!nextDue) return setError("Pick the next due date.")

    const days = Number.parseInt(remindDaysBefore, 10)
    if (!Number.isFinite(days) || days < 0 || days > 30) return setError("Remind between 0 and 30 days before.")
    if (endDate && endDate < nextDue) return setError("The end date can't be before the due date.")

    onSubmit({
      description: description.trim(),
      amount: value,
      category,
      frequency,
      kind,
      nextDue,
      remindersEnabled,
      remindDaysBefore: days,
      endDate: endDate || null,
      autopay,
      notes: notes.trim() || null,
    })

    setError("")
    // Only clear for a fresh entry; when editing the caller closes the form.
    if (!editing) {
      setDescription("")
      setAmount("")
      setNextDue(todayISO())
      setEndDate("")
      setNotes("")
      setAutopay(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {editing ? <Save className="size-4 text-[#f0abfc]" /> : <Plus className="size-4 text-[#f0abfc]" />}
          {editing ? "Edit commitment" : "Add commitment"}
        </CardTitle>
        <CardDescription>
          {editing ? "Change the details and save." : "Track a bill, EMI or subscription before it's due."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="commitment-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                ₹
              </span>
              <Input
                id="commitment-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 pl-10 text-2xl font-bold tabular-nums md:text-2xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commitment-description">Description</Label>
            <Input
              id="commitment-description"
              placeholder="e.g. House rent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="commitment-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="commitment-category">
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commitment-kind">Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as CommitmentKind)}>
                <SelectTrigger id="commitment-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commitment-frequency">Repeats</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                <SelectTrigger id="commitment-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commitment-due">Next due</Label>
              <Input id="commitment-due" type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-3">
              <Checkbox
                id="commitment-reminders"
                checked={remindersEnabled}
                onCheckedChange={(checked) => setRemindersEnabled(checked === true)}
              />
              <Label htmlFor="commitment-reminders" className="cursor-pointer">
                Remind me before it’s due
              </Label>
            </div>
            {remindersEnabled && (
              <div className="animate-rise-in flex items-center gap-2 pt-1">
                <Input
                  id="commitment-remind-days"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="30"
                  value={remindDaysBefore}
                  onChange={(e) => setRemindDaysBefore(e.target.value)}
                  className="w-20"
                  aria-label="Days before the due date"
                />
                <span className="text-sm text-muted-foreground">days before</span>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="commitment-end">Last due date (optional)</Label>
              <Input id="commitment-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <p className="text-xs text-muted-foreground">For plans that end, like a 12-month EMI.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commitment-notes">Notes (optional)</Label>
              <Input
                id="commitment-notes"
                placeholder="e.g. paid by UPI"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <Checkbox id="commitment-autopay" checked={autopay} onCheckedChange={(checked) => setAutopay(checked === true)} />
            <Label htmlFor="commitment-autopay" className="cursor-pointer">
              Auto-paid (standing instruction)
            </Label>
          </div>

          {error && (
            <p role="alert" className="animate-rise-in flex items-center gap-2 text-sm text-destructive">
              <CircleAlert className="size-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" size="lg" className="flex-1">
              {editing ? (
                <>
                  <Save /> Save changes
                </>
              ) : (
                <>
                  <Plus /> Add commitment
                </>
              )}
            </Button>
            {editing && onCancel && (
              <Button type="button" size="lg" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
