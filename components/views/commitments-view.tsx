"use client"

import {
  CalendarClock,
  Check,
  CircleAlert,
  Pause,
  Pencil,
  Play,
  Repeat,
  SkipForward,
  Trash2,
  Wallet,
} from "lucide-react"
import { useMemo, useState } from "react"
import { CategoryIcon } from "@/components/category-icon"
import { CommitmentForm } from "@/components/commitment-form"
import { EmptyState } from "@/components/empty-state"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  commitmentStatus,
  daysUntil,
  isOpen,
  KIND_LABELS,
  sortForDisplay,
  STATUS_LABELS,
  sumMonthly,
  type CommitmentStatus,
} from "@/lib/commitments"
import { formatCurrency, formatCurrencyWhole, formatDate, todayISO } from "@/lib/format"
import { useExpenseStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<CommitmentStatus, string> = {
  overdue: "bg-destructive/15 text-destructive ring-destructive/30",
  "due-today": "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  "due-soon": "bg-[#d8b4fe]/15 text-[#d8b4fe] ring-[#d8b4fe]/30",
  upcoming: "bg-white/5 text-muted-foreground ring-white/10",
  paused: "bg-white/5 text-muted-foreground ring-white/10",
  ended: "bg-white/5 text-muted-foreground ring-white/10",
}

/** "in 3 days", "today", "5 days ago" — friendlier than a bare date. */
const dueHint = (days: number) => {
  if (days === 0) return "today"
  if (days === 1) return "tomorrow"
  if (days === -1) return "yesterday"
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`
}

export function CommitmentsView() {
  const {
    commitments,
    categories,
    addCommitment,
    updateCommitment,
    deleteCommitment,
    processCommitment,
    skipCommitment,
    toggleCommitment,
    busyCommitments,
  } = useExpenseStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const today = todayISO()

  const sorted = useMemo(() => sortForDisplay(commitments, today), [commitments, today])
  const open = useMemo(() => sorted.filter((c) => isOpen(commitmentStatus(c, today))), [sorted, today])
  const overdue = useMemo(
    () => open.filter((c) => commitmentStatus(c, today) === "overdue"),
    [open, today],
  )
  const dueWithinWeek = useMemo(
    () => open.filter((c) => daysUntil(c.nextDue, today) <= 7),
    [open, today],
  )
  const monthlyTotal = useMemo(() => sumMonthly(open), [open])

  const editing = editingId ? commitments.find((c) => c.id === editingId) : undefined

  const saveEdit = (values: Parameters<typeof addCommitment>[0]) => {
    if (editingId) updateCommitment(editingId, values)
    setEditingId(null)
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        <CommitmentForm
          key={editingId ?? "new"}
          categories={categories}
          commitment={editing}
          onSubmit={(values) => (editingId ? saveEdit(values) : addCommitment(values))}
          onCancel={editingId ? () => setEditingId(null) : undefined}
        />
      </div>

      <div className="min-w-0 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Active"
            value={String(open.length)}
            hint={
              dueWithinWeek.length > 0
                ? `${dueWithinWeek.length} due within a week`
                : "nothing due this week"
            }
            icon={Repeat}
            index={0}
          />
          <StatCard
            label="Committed monthly"
            value={formatCurrencyWhole(monthlyTotal)}
            hint="weekly and yearly spread out"
            icon={Wallet}
            index={1}
          />
          <StatCard
            label="Overdue"
            value={String(overdue.length)}
            hint={overdue.length > 0 ? "worth clearing first" : "all clear"}
            icon={CircleAlert}
            highlight={overdue.length > 0}
            index={2}
          />
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Your commitments</CardTitle>
            <CardDescription>
              {commitments.length === 0
                ? "Nothing tracked yet."
                : `${commitments.length} tracked · ${open.length} active`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-4">
            {sorted.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No commitments yet"
                description="Add rent, an EMI or a subscription with the form and it will show up here before it's due."
              />
            ) : (
              <ul className="max-h-[42rem] space-y-2 overflow-y-auto pr-1">
                {sorted.map((commitment, index) => {
                  const status = commitmentStatus(commitment, today)
                  const days = daysUntil(commitment.nextDue, today)
                  const isEditing = editingId === commitment.id
                  const confirming = confirmDeleteId === commitment.id
                  // A mutation for this row is in flight: block the buttons so a
                  // double-click can't pay/skip two periods from one intent.
                  const busy = busyCommitments.includes(commitment.id)

                  return (
                    <li
                      key={commitment.id}
                      className={cn(
                        "animate-rise-in rounded-2xl border p-3.5 transition-all duration-300 ease-out-expo",
                        status === "overdue"
                          ? "border-destructive/25 bg-destructive/[0.04]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20",
                        isEditing && "ring-2 ring-primary/40",
                      )}
                      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <CategoryIcon category={commitment.category} />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium">{commitment.description}</p>
                            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-white/10">
                              {KIND_LABELS[commitment.kind]}
                            </span>
                            {commitment.autopay && (
                              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/25">
                                Auto
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatCurrency(commitment.amount)} · {commitment.frequency} · next{" "}
                            {formatDate(commitment.nextDue)}
                          </p>
                          {commitment.notes && <p className="mt-0.5 truncate text-xs text-muted-foreground">{commitment.notes}</p>}
                        </div>

                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                            STATUS_STYLES[status],
                          )}
                        >
                          {STATUS_LABELS[status]}
                          {isOpen(status) && ` · ${dueHint(days)}`}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {isOpen(status) && (
                          <Button size="sm" disabled={busy} onClick={() => processCommitment(commitment.id)}>
                            <Check /> Mark paid
                          </Button>
                        )}

                        {isOpen(status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            title="Move to the next period without logging an expense"
                            onClick={() => skipCommitment(commitment.id)}
                          >
                            <SkipForward /> Skip
                          </Button>
                        )}

                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={busy}
                          title={commitment.isActive ? "Pause reminders" : "Resume"}
                          aria-label={commitment.isActive ? "Pause" : "Resume"}
                          onClick={() => toggleCommitment(commitment.id)}
                        >
                          {commitment.isActive ? <Pause /> : <Play />}
                        </Button>

                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title="Edit"
                          aria-label="Edit"
                          onClick={() => setEditingId(isEditing ? null : commitment.id)}
                        >
                          <Pencil />
                        </Button>

                        {confirming ? (
                          <span className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Delete this?</span>
                            <Button
                              size="xs"
                              variant="destructive"
                              disabled={busy}
                              onClick={() => {
                                deleteCommitment(commitment.id)
                                setConfirmDeleteId(null)
                              }}
                            >
                              Delete
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                              Keep
                            </Button>
                          </span>
                        ) : (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="ml-auto text-muted-foreground hover:text-destructive"
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => setConfirmDeleteId(commitment.id)}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
