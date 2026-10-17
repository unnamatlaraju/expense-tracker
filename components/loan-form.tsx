"use client"

import { CircleAlert, Landmark, Plus, Save } from "lucide-react"
import { type FormEvent, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency, formatDate, todayISO } from "@/lib/format"
import { buildSchedule } from "@/lib/loans"
import type { Loan, NewLoan } from "@/lib/types"

/**
 * One form for both adding and editing a loan. The caller mounts it with a
 * `key` so switching rows re-seeds the fields. The EMI preview updates as you
 * type, because the whole point of the page is seeing what the terms mean
 * before you commit to them.
 */
export function LoanForm({
  loan,
  onSubmit,
  onCancel,
}: {
  loan?: Loan
  onSubmit: (values: NewLoan) => void | Promise<void>
  onCancel?: () => void
}) {
  const editing = Boolean(loan)
  const [name, setName] = useState(loan?.name ?? "")
  const [lender, setLender] = useState(loan?.lender ?? "")
  const [principal, setPrincipal] = useState(loan ? String(loan.principal) : "")
  const [annualRate, setAnnualRate] = useState(loan ? String(loan.annualRate) : "")
  const [tenureMonths, setTenureMonths] = useState(loan ? String(loan.tenureMonths) : "")
  const [firstDue, setFirstDue] = useState(loan?.firstDue ?? todayISO())
  const [notes, setNotes] = useState(loan?.notes ?? "")
  const [error, setError] = useState("")
  // A ref is the guard (synchronous, so a second submit in the same tick can't
  // slip through) and the state drives the button's disabled look.
  const submittingRef = useRef(false)
  const [submitting, setSubmitting] = useState(false)

  // Only computed when every field parses, so the preview never shows a figure
  // built from half-typed input.
  const preview = useMemo(() => {
    const amount = Number.parseFloat(principal)
    const rate = Number.parseFloat(annualRate || "0")
    const months = Number.parseInt(tenureMonths, 10)

    if (!Number.isFinite(amount) || amount <= 0) return null
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return null
    if (!Number.isInteger(months) || months < 1 || months > 600) return null

    return buildSchedule({ principal: amount, annualRate: rate, tenureMonths: months, firstDue: firstDue || todayISO() })
  }, [principal, annualRate, tenureMonths, firstDue])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submittingRef.current) return

    const amount = Number.parseFloat(principal)
    if (!name.trim()) return setError("Give the loan a name, e.g. “Car loan”.")
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter the amount you borrowed.")

    const rate = Number.parseFloat(annualRate || "0")
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return setError("Enter an interest rate between 0 and 100%.")
    if (!Number.isInteger(Number.parseInt(tenureMonths, 10))) return setError("Enter the tenure in whole months.")

    const months = Number.parseInt(tenureMonths, 10)
    if (months < 1 || months > 600) return setError("The tenure must be between 1 and 600 months.")
    if (!firstDue) return setError("Pick the date of the first instalment.")

    submittingRef.current = true
    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        lender: lender.trim() || undefined,
        principal: amount,
        annualRate: rate,
        tenureMonths: months,
        firstDue,
        notes: notes.trim() || undefined,
      })
      setError("")
      if (!editing) {
        setName("")
        setLender("")
        setPrincipal("")
        setAnnualRate("")
        setTenureMonths("")
        setFirstDue(todayISO())
        setNotes("")
      }
    } catch {
      setError("Could not save the loan. Please try again.")
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {editing ? <Save className="size-4 text-[#f0abfc]" /> : <Landmark className="size-4 text-[#f0abfc]" />}
          {editing ? "Edit loan" : "Add a loan"}
        </CardTitle>
        <CardDescription>
          {editing ? "Change the terms and save." : "Enter the terms and see the real cost straight away."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="loan-name">Name</Label>
            <Input
              id="loan-name"
              placeholder="e.g. Car loan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan-principal">Amount borrowed</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                ₹
              </span>
              <Input
                id="loan-principal"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="h-14 pl-10 text-2xl font-bold tabular-nums"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="loan-rate">Interest rate (% per year)</Label>
              <Input
                id="loan-rate"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g. 9.5"
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-tenure">Tenure (months)</Label>
              <Input
                id="loan-tenure"
                type="number"
                inputMode="numeric"
                min="1"
                max="600"
                step="1"
                placeholder="e.g. 60"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-first-due">First instalment</Label>
              <Input id="loan-first-due" type="date" value={firstDue} onChange={(e) => setFirstDue(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-lender">Lender (optional)</Label>
              <Input
                id="loan-lender"
                placeholder="e.g. HDFC Bank"
                value={lender}
                onChange={(e) => setLender(e.target.value)}
              />
            </div>
          </div>

          {preview && (
            <dl className="animate-rise-in grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Monthly EMI</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">{formatCurrency(preview.emi)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Total interest</dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums">{formatCurrency(preview.totalInterest)}</dd>
              </div>
              <div className="col-span-2 text-xs text-muted-foreground">
                You would repay {formatCurrency(preview.totalPayable)} in total, finishing{" "}
                {formatDate(preview.lastDue)}.
              </div>
            </dl>
          )}

          <div className="space-y-2">
            <Label htmlFor="loan-notes">Notes (optional)</Label>
            <Input
              id="loan-notes"
              placeholder="e.g. prepayment allowed after 6 months"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="animate-rise-in flex items-center gap-2 text-sm text-destructive">
              <CircleAlert className="size-4 shrink-0" />
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button type="submit" size="lg" className="flex-1" disabled={submitting}>
              {editing ? (
                <>
                  <Save /> Save changes
                </>
              ) : (
                <>
                  <Plus /> Add loan
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
