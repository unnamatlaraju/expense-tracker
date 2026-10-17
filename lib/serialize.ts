import type {
  Budget as PrismaBudget,
  Commitment as PrismaCommitment,
  Expense as PrismaExpense,
  Loan as PrismaLoan,
} from "@prisma/client"
import type { Budget, Commitment, CommitmentKind, Expense, Frequency, Loan } from "@/lib/types"

/**
 * Prisma returns `Decimal` (money) and `Date` (date-only) objects. The UI works
 * with plain numbers and `YYYY-MM-DD` strings, so the API converts at the edge
 * and the components stay untouched.
 */

export const toISODate = (value: Date) => value.toISOString().slice(0, 10)

export const serializeExpense = (e: PrismaExpense): Expense => ({
  id: e.id,
  description: e.description,
  amount: Number(e.amount),
  category: e.category,
  date: toISODate(e.date),
  isRecurring: e.isRecurring,
  recurringFrequency: (e.recurringFrequency as Frequency | null) ?? undefined,
})

export const serializeBudget = (b: PrismaBudget): Budget => ({
  category: b.category,
  limit: Number(b.limit),
})

export const serializeLoan = (l: PrismaLoan): Loan => ({
  id: l.id,
  name: l.name,
  lender: l.lender ?? undefined,
  principal: Number(l.principal),
  annualRate: Number(l.annualRate),
  tenureMonths: l.tenureMonths,
  firstDue: toISODate(l.firstDue),
  notes: l.notes ?? undefined,
})

export const serializeCommitment = (c: PrismaCommitment): Commitment => ({
  id: c.id,
  description: c.description,
  amount: Number(c.amount),
  category: c.category,
  frequency: c.frequency as Frequency,
  kind: c.kind as CommitmentKind,
  nextDue: toISODate(c.nextDue),
  isActive: c.isActive,
  remindersEnabled: c.remindersEnabled,
  remindDaysBefore: c.remindDaysBefore,
  endDate: c.endDate ? toISODate(c.endDate) : undefined,
  autopay: c.autopay,
  notes: c.notes ?? undefined,
})
