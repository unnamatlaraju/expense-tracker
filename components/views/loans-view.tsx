"use client"

import { Landmark, Plus, TrendingDown, Wallet } from "lucide-react"
import { useMemo, useState } from "react"
import { EmptyState } from "@/components/empty-state"
import { LoanCard } from "@/components/loan-card"
import { LoanForm } from "@/components/loan-form"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrencyWhole, todayISO } from "@/lib/format"
import { buildSchedule } from "@/lib/loans"
import { useExpenseStore } from "@/lib/store"

export function LoansView() {
  const { loans, addLoan, updateLoan, deleteLoan } = useExpenseStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  const today = todayISO()
  const editing = editingId ? loans.find((l) => l.id === editingId) : undefined

  // Every figure on the page comes from here, so it can never disagree with the
  // schedule rendered inside each card.
  const totals = useMemo(
    () =>
      loans.reduce(
        (sum, loan) => {
          const schedule = buildSchedule(loan)
          return {
            borrowed: sum.borrowed + loan.principal,
            interest: sum.interest + schedule.totalInterest,
            monthly: sum.monthly + schedule.emi,
          }
        },
        { borrowed: 0, interest: 0, monthly: 0 },
      ),
    [loans],
  )

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        <LoanForm
          key={editingId ?? "new"}
          loan={editing}
          onSubmit={(values) => (editingId ? updateLoan(editingId, values) : addLoan(values))}
          onCancel={editingId ? () => setEditingId(null) : undefined}
        />
      </div>

      <div className="min-w-0 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Borrowed"
            value={formatCurrencyWhole(totals.borrowed)}
            hint={loans.length === 1 ? "across 1 loan" : `across ${loans.length} loans`}
            icon={Wallet}
            index={0}
          />
          <StatCard
            label="Total interest"
            value={formatCurrencyWhole(totals.interest)}
            hint="on top of what you borrowed"
            icon={TrendingDown}
            index={1}
          />
          <StatCard
            label="Monthly EMIs"
            value={formatCurrencyWhole(totals.monthly)}
            hint="every month until the last instalment"
            icon={Landmark}
            highlight={loans.length > 0}
            index={2}
          />
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Your loans</CardTitle>
            <CardDescription>
              {loans.length === 0
                ? "Nothing added yet."
                : `${loans.length} ${loans.length === 1 ? "loan" : "loans"} · figures update as the months pass`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-4">
            {loans.length === 0 ? (
              <EmptyState
                icon={Landmark}
                title="No loans yet"
                description="Add a loan with the form and you'll see the EMI, the total interest, the payoff date and the full month-by-month schedule."
              >
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Plus className="size-3.5" />
                  Enter the amount, rate and tenure to begin
                </p>
              </EmptyState>
            ) : (
              <ul className="space-y-4">
                {loans.map((loan, index) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    today={today}
                    index={index}
                    onEdit={() => setEditingId(editingId === loan.id ? null : loan.id)}
                    onDelete={() => {
                      deleteLoan(loan.id)
                      if (editingId === loan.id) setEditingId(null)
                    }}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
