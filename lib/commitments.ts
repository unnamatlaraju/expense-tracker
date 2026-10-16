import { addFrequency } from "@/lib/format"
import type { Commitment, CommitmentKind, Frequency } from "@/lib/types"

/**
 * Pure due-date logic for commitments. Kept free of Prisma and React so the
 * tricky parts (boundaries, month ends, end dates) are easy to unit test.
 */

export type CommitmentStatus = "ended" | "paused" | "overdue" | "due-today" | "due-soon" | "upcoming"

/** Whole days from `today` to `date`. Negative means overdue. Both are `YYYY-MM-DD`. */
export const daysUntil = (date: string, today: string) =>
  Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000)

type StatusInput = Pick<Commitment, "nextDue" | "isActive" | "remindDaysBefore" | "endDate">

export const commitmentStatus = (item: StatusInput, today: string): CommitmentStatus => {
  // Past its end date the remaining period simply isn't owed, whatever isActive says.
  if (item.endDate && item.nextDue > item.endDate) return "ended"
  if (!item.isActive) return "paused"
  const days = daysUntil(item.nextDue, today)
  if (days < 0) return "overdue"
  if (days === 0) return "due-today"
  if (days <= item.remindDaysBefore) return "due-soon"
  return "upcoming"
}

/** True for statuses that still represent money to pay. */
export const isOpen = (status: CommitmentStatus) => status !== "paused" && status !== "ended"

export const STATUS_LABELS: Record<CommitmentStatus, string> = {
  ended: "Ended",
  paused: "Paused",
  overdue: "Overdue",
  "due-today": "Due today",
  "due-soon": "Due soon",
  upcoming: "Upcoming",
}

export const KIND_LABELS: Record<CommitmentKind, string> = {
  bill: "Bill",
  emi: "EMI / Loan",
  subscription: "Subscription",
  other: "Other",
}

/**
 * Advance a commitment by exactly one period. Once the next period falls past
 * `endDate` the plan has run its course, so it deactivates itself rather than
 * nagging forever.
 */
export const advanceCommitment = (current: {
  nextDue: string
  frequency: Frequency
  endDate?: string | null
}) => {
  const nextDue = addFrequency(current.nextDue, current.frequency)
  const ended = Boolean(current.endDate && nextDue > current.endDate)
  return { nextDue, ended, isActive: !ended }
}

/** Approximate monthly cost, so mixed frequencies can be compared. */
export const monthlyEquivalent = (amount: number, frequency: Frequency) => {
  if (frequency === "weekly") return (amount * 52) / 12
  if (frequency === "yearly") return amount / 12
  return amount
}

export const sumMonthly = (items: Pick<Commitment, "amount" | "frequency">[]) =>
  items.reduce((total, item) => total + monthlyEquivalent(item.amount, item.frequency), 0)

/** Display order: open items first, soonest due first, paused/ended last. */
export const sortForDisplay = (items: Commitment[], today: string) =>
  [...items].sort((a, b) => {
    const aOpen = isOpen(commitmentStatus(a, today))
    const bOpen = isOpen(commitmentStatus(b, today))
    if (aOpen !== bOpen) return aOpen ? -1 : 1
    const byDue = a.nextDue.localeCompare(b.nextDue)
    return byDue !== 0 ? byDue : a.description.localeCompare(b.description)
  })
