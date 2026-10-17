"use client"

import { CalendarClock, ChevronDown, Download, Landmark, Pencil, TrendingDown, Trash2, TriangleAlert } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { exportScheduleToCSV } from "@/lib/export"
import { formatCurrency, formatCurrencyWhole, formatDate } from "@/lib/format"
import { addMonths, buildSchedule, instalmentsDueBy, simulatePrepayment } from "@/lib/loans"
import type { Loan } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * One loan, with everything derived from its terms: the EMI, the interest
 * split, how far along the schedule is by today's date, and what an extra
 * monthly payment would save. Nothing here is stored, so there is no cached
 * copy to fall out of step with the numbers the user typed.
 */
export function LoanCard({
  loan,
  today,
  onEdit,
  onDelete,
  index = 0,
}: {
  loan: Loan
  today: string
  onEdit: () => void
  onDelete: () => void
  index?: number
}) {
  const schedule = useMemo(() => buildSchedule(loan), [loan])
  const [showSchedule, setShowSchedule] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [extra, setExtra] = useState("")

  const dueCount = instalmentsDueBy(schedule, today)
  const progress = loan.tenureMonths > 0 ? Math.min(100, (dueCount / loan.tenureMonths) * 100) : 0
  const repaid = schedule.instalments.slice(0, dueCount).reduce((sum, row) => sum + row.principal, 0)
  const outstanding = schedule.instalments.slice(dueCount).reduce((sum, row) => sum + row.payment, 0)
  const next = dueCount < schedule.instalments.length ? schedule.instalments[dueCount] : null

  const extraValue = Number.parseFloat(extra)
  const impact = useMemo(
    () => (Number.isFinite(extraValue) && extraValue > 0 ? simulatePrepayment(loan, extraValue) : null),
    [loan, extraValue],
  )

  return (
    <li
      className="animate-rise-in glass rounded-3xl p-5"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/5 text-[#d8b4fe] ring-1 ring-white/10">
          <Landmark className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold">{loan.name}</p>
            {loan.lender && (
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-white/10">
                {loan.lender}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatCurrency(loan.principal)} at {loan.annualRate}% p.a. over {loan.tenureMonths}{" "}
            {loan.tenureMonths === 1 ? "month" : "months"}
          </p>
          {loan.notes && <p className="mt-0.5 truncate text-xs text-muted-foreground">{loan.notes}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button size="icon-sm" variant="ghost" title="Edit" aria-label="Edit loan" onClick={onEdit}>
            <Pencil />
          </Button>
          {confirming ? (
            <span className="flex items-center gap-1.5">
              <Button size="xs" variant="destructive" onClick={onDelete}>
                Delete
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setConfirming(false)}>
                Keep
              </Button>
            </span>
          ) : (
            <Button
              size="icon-sm"
              variant="ghost"
              title="Delete"
              aria-label="Delete loan"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => setConfirming(true)}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <dt className="text-xs text-muted-foreground">Monthly EMI</dt>
          <dd className="mt-0.5 text-lg font-bold tabular-nums">{formatCurrency(schedule.emi)}</dd>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <dt className="text-xs text-muted-foreground">Total interest</dt>
          <dd className="mt-0.5 text-lg font-bold tabular-nums">{formatCurrency(schedule.totalInterest)}</dd>
        </div>
        <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:col-span-1">
          <dt className="text-xs text-muted-foreground">Total payable</dt>
          <dd className="mt-0.5 text-lg font-bold tabular-nums">{formatCurrency(schedule.totalPayable)}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            {dueCount} of {loan.tenureMonths} instalments due so far
          </span>
          <span className="tabular-nums text-muted-foreground">
            {formatCurrencyWhole(repaid)} of {formatCurrencyWhole(loan.principal)} principal
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={loan.tenureMonths}
          aria-valuenow={dueCount}
          aria-label={`Instalments due so far for ${loan.name}`}
          className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
        >
          <span className="bg-aurora block h-full rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {next ? (
            <>
              Next instalment {formatCurrency(next.payment)} on {formatDate(next.due)} · pays off{" "}
              {formatDate(schedule.lastDue)}
            </>
          ) : (
            <>Every instalment is due · final payment {formatDate(schedule.lastDue)}</>
          )}
          {outstanding > 0 && <> · {formatCurrencyWhole(outstanding)} still to pay</>}
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <TrendingDown className="size-4 shrink-0 text-[#d8b4fe]" />
          <span className="text-sm font-medium">Pay extra each month?</span>
          <div className="ml-auto flex items-center gap-2">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="100"
              placeholder="0"
              aria-label={`Extra monthly payment for ${loan.name}`}
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              className="h-9 w-28 text-sm"
            />
          </div>
        </div>

        {impact && (
          <p className="animate-rise-in mt-2.5 text-xs">
            {impact.neverRepays ? (
              <span className="flex items-center gap-1.5 text-amber-300">
                <TriangleAlert className="size-3.5 shrink-0" />
                That extra does not even cover the monthly interest, so the loan would never be repaid.
              </span>
            ) : (
              <span className="text-muted-foreground">
                Clears the loan in <span className="font-semibold text-foreground">{impact.months}</span>{" "}
                {impact.months === 1 ? "instalment" : "instalments"}
                {impact.monthsSaved > 0 && (
                  <>
                    {" "}
                    (<span className="font-semibold text-emerald-300">{impact.monthsSaved} fewer</span>, finishing{" "}
                    {formatDate(addMonths(loan.firstDue, impact.months - 1))})
                  </>
                )}
                . Interest paid drops to{" "}
                <span className="font-semibold text-foreground">{formatCurrency(impact.totalInterest)}</span>
                {impact.interestSaved > 0 && (
                  <>
                    {" "}
                    — you save{" "}
                    <span className="font-semibold text-emerald-300">{formatCurrency(impact.interestSaved)}</span>
                  </>
                )}
                .
              </span>
            )}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" aria-expanded={showSchedule} onClick={() => setShowSchedule((v) => !v)}>
          <ChevronDown className={cn("transition-transform duration-300", showSchedule && "rotate-180")} />
          {showSchedule ? "Hide schedule" : "Show schedule"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => exportScheduleToCSV(loan.name, schedule)}>
          <Download />
          Download CSV
        </Button>
      </div>

      {showSchedule && (
        <div
          role="region"
          aria-label={`Amortisation schedule for ${loan.name}`}
          tabIndex={0}
          className="animate-rise-in mt-3 max-h-80 overflow-auto rounded-2xl border border-white/10 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
        >
          <table className="w-full min-w-[40rem] text-right text-xs tabular-nums">
            <caption className="sr-only">
              Month by month repayment plan for {loan.name}: opening balance, payment, interest, principal and closing
              balance.
            </caption>
            <thead className="sticky top-0 bg-[#14142e]/95 text-muted-foreground backdrop-blur">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">#</th>
                <th scope="col" className="px-3 py-2 text-left font-medium">Due</th>
                <th scope="col" className="px-3 py-2 font-medium">Opening</th>
                <th scope="col" className="px-3 py-2 font-medium">Payment</th>
                <th scope="col" className="px-3 py-2 font-medium">Interest</th>
                <th scope="col" className="px-3 py-2 font-medium">Principal</th>
                <th scope="col" className="px-3 py-2 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {schedule.instalments.map((row) => {
                const past = row.number <= dueCount
                return (
                  // Instalments already due are tinted rather than dimmed: fading
                  // the text drops it below the 4.5:1 contrast minimum.
                  <tr key={row.number} className={cn("border-t border-white/5", past && "bg-white/[0.03]")}>
                    <td className="px-3 py-1.5 text-left">{row.number}</td>
                    <td className="px-3 py-1.5 text-left whitespace-nowrap">
                      {past && <CalendarClock aria-hidden className="mr-1 inline size-3 align-[-1px]" />}
                      {formatDate(row.due)}
                    </td>
                    <td className="px-3 py-1.5">{formatCurrency(row.opening)}</td>
                    <td className="px-3 py-1.5">{formatCurrency(row.payment)}</td>
                    <td className="px-3 py-1.5">{formatCurrency(row.interest)}</td>
                    <td className="px-3 py-1.5">{formatCurrency(row.principal)}</td>
                    <td className="px-3 py-1.5">{formatCurrency(row.closing)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </li>
  )
}
