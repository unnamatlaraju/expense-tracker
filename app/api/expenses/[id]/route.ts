import type { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { badRequest, notFound, readJson, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { prisma } from "@/lib/db"
import { serializeExpense } from "@/lib/serialize"
import { updateExpenseSchema } from "@/lib/validation"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  try {
    // Scoping by userId means a user can never delete someone else's row, and
    // `deleteMany` returns a count instead of throwing when nothing matched.
    const { count } = await prisma.expense.deleteMany({ where: { id, userId: session.userId } })
    if (count === 0) return notFound("Expense not found.")
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("delete expense failed", error)
    return serverError()
  }
}

/**
 * Edits one expense. Scoped by `userId` in the filter, so a guessed id from
 * another account matches nothing and returns 404 rather than leaking whether
 * the row exists.
 *
 * `commitmentId` and `periodStart` are intentionally never touched: those tie
 * the row to a commitment's idempotency key, and rewriting them would let the
 * same period be logged twice.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const parsed = updateExpenseSchema.safeParse(await readJson(request))
  if (!parsed.success) return badRequest(parsed.error)

  const { id } = await params
  const input = parsed.data

  // Built field by field so an absent key stays absent and an existing value is
  // never clobbered by a `undefined` default.
  const data: Prisma.ExpenseUpdateManyMutationInput = {}
  if (input.description !== undefined) data.description = input.description
  if (input.amount !== undefined) data.amount = input.amount
  if (input.category !== undefined) data.category = input.category
  if (input.date !== undefined) data.date = new Date(input.date)
  if (input.recurringFrequency !== undefined) {
    data.isRecurring = Boolean(input.recurringFrequency)
    data.recurringFrequency = input.recurringFrequency
  }

  try {
    const { count } = await prisma.expense.updateMany({ where: { id, userId: session.userId }, data })
    if (count === 0) return notFound("Expense not found.")

    const expense = await prisma.expense.findUnique({ where: { id } })
    if (!expense) return notFound("Expense not found.")
    return NextResponse.json({ expense: serializeExpense(expense) })
  } catch (error) {
    console.error("update expense failed", error)
    return serverError()
  }
}
