"use client"

import { CircleAlert, Repeat, Save } from "lucide-react"
import { type FormEvent, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiError } from "@/lib/api-client"
import { addFrequency } from "@/lib/format"
import { useExpenseStore } from "@/lib/store"
import type { Frequency } from "@/lib/types"
import { cn } from "@/lib/utils"

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
  { value: "yearly", label: "Every year" },
]

/**
 * Edits one expense. The caller mounts this with `key={expenseId}` so switching
 * rows remounts it and re-seeds the fields, rather than showing the previous
 * row's values.
 */
export function EditExpenseDialog({ expenseId, onClose }: { expenseId: string; onClose: () => void }) {
  const { expenses, categories, updateExpense, addCommitment } = useExpenseStore()
  const expense = expenses.find((e) => e.id === expenseId)

  const [amount, setAmount] = useState(expense ? String(expense.amount) : "")
  const [description, setDescription] = useState(expense?.description ?? "")
  const [category, setCategory] = useState(expense?.category ?? categories[0] ?? "Others")
  const [date, setDate] = useState(expense?.date ?? "")
  const [isRecurring, setIsRecurring] = useState(Boolean(expense?.recurringFrequency))
  const [frequency, setFrequency] = useState<Frequency>(expense?.recurringFrequency ?? "monthly")
  const [error, setError] = useState("")
  // Whether the row was already a repeat when the dialog opened, and whether
  // this dialog has already added a commitment for it. Together they mean the
  // "Repeat" box can be toggled back and forth without creating duplicates.
  const wasRecurringRef = useRef(Boolean(expense?.recurringFrequency))
  const commitmentAddedRef = useRef(false)
  // Synchronous guard against a double submit; the state only drives the
  // button's disabled look.
  const submittingRef = useRef(false)
  const [submitting, setSubmitting] = useState(false)

  // The row can disappear underneath us (deleted in another tab, or by another
  // session). Nothing to render an editor for, so the caller closes.
  if (!expense) return null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submittingRef.current) return

    const value = Number.parseFloat(amount)
    if (!Number.isFinite(value) || value <= 0) return setError("Enter an amount greater than 0.")
    if (!description.trim()) return setError("Add a short description, e.g. “Lunch”.")
    if (!date) return setError("Pick a date.")

    submittingRef.current = true
    setSubmitting(true)
    try {
      await updateExpense(expense.id, {
        description: description.trim(),
        amount: value,
        category,
        date,
        // `null` (not `undefined`) is what clears the flag server-side.
        recurringFrequency: isRecurring ? frequency : null,
      })

      // Switching a one-off to a repeat also puts it on the Commitments page,
      // exactly as the add form does. Only on a real change, and only once per
      // dialog, so this can't quietly duplicate a commitment.
      if (isRecurring && !wasRecurringRef.current && !commitmentAddedRef.current) {
        commitmentAddedRef.current = true
        await addCommitment({
          description: description.trim(),
          amount: value,
          category,
          frequency,
          kind: "other",
          nextDue: addFrequency(date, frequency),
        })
      }

      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
      setSubmitting(false)
      submittingRef.current = false
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit expense</DialogTitle>
          <DialogDescription>Change the details and save.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                ₹
              </span>
              <Input
                id="edit-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 pl-10 text-2xl font-bold tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              placeholder="e.g. Lunch at canteen"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="edit-category">
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
              <Label htmlFor="edit-date">Date</Label>
              <Input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-3">
              <Checkbox
                id="edit-recurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked === true)}
              />
              <Label htmlFor="edit-recurring" className="cursor-pointer">
                Repeat this expense
              </Label>
              <Repeat className="ml-auto size-4 text-muted-foreground" />
            </div>
            {isRecurring && (
              <div
                role="radiogroup"
                aria-label="How often"
                className="animate-rise-in grid grid-cols-3 gap-1 rounded-xl bg-white/5 p-1"
              >
                {FREQUENCIES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    role="radio"
                    aria-checked={f.value === frequency}
                    onClick={() => setFrequency(f.value)}
                    className={cn(
                      "cursor-pointer rounded-lg py-1.5 text-xs font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      f.value === frequency ? "bg-aurora glow text-white" : "text-foreground/90 hover:text-foreground",
                    )}
                  >
                    {f.value}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="animate-rise-in flex items-center gap-2 text-sm text-destructive">
              <CircleAlert className="size-4 shrink-0" />
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              <Save />
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
