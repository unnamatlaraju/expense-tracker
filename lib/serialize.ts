import type { Budget as PrismaBudget, Expense as PrismaExpense, RecurringExpense as PrismaRecurring } from "@prisma/client"
import type { Budget, Expense, Frequency, RecurringExpense } from "@/lib/types"

/**
 * Prisma returns `Decimal` (money) and `Date` (date-only) objects. The UI works
 * with plain numbers and `YYYY-MM-DD` strings, so the API converts at the edge
 * and the components stay untouched.
 */

const toISODate = (value: Date) => value.toISOString().slice(0, 10)

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

export const serializeRecurring = (r: PrismaRecurring): RecurringExpense => ({
  id: r.id,
  description: r.description,
  amount: Number(r.amount),
  category: r.category,
  frequency: r.frequency as Frequency,
  nextDue: toISODate(r.nextDue),
  isActive: r.isActive,
})
