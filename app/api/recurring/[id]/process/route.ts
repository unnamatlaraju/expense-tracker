import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { notFound, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { addFrequency, todayISOIn } from "@/lib/format"
import { prisma } from "@/lib/db"
import { serializeExpense, serializeRecurring } from "@/lib/serialize"
import type { Expense } from "@prisma/client"

/**
 * Logs this period's payment as an expense and rolls `nextDue` forward.
 *
 * This is idempotent. Each expense is tagged with the commitment it came from
 * and the period it covers; a unique index on that pair means a double-click
 * (two in-flight requests that both read the same `nextDue`) can never log the
 * same period twice. The loser of the race returns the row the winner wrote
 * instead of erroring. Both writes also share one transaction so the expense
 * and the advanced `nextDue` can't get out of sync.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { userId } = session

  const [item, user] = await Promise.all([
    prisma.recurringExpense.findFirst({ where: { id, userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ]).catch((error) => {
    console.error("process recurring lookup failed", error)
    return [null, null] as const
  })

  if (!item) return notFound("Recurring expense not found.")
  if (!item.isActive) return NextResponse.json({ error: "This schedule is paused." }, { status: 400 })

  // The period this call covers is whatever was due when we read the record.
  const periodStart = item.nextDue

  const duplicate = async (expense: Expense) => {
    // Re-read so a racing request's advanced `nextDue` is reflected in the UI.
    const fresh = await prisma.recurringExpense.findFirst({ where: { id, userId } })
    return NextResponse.json({
      expense: serializeExpense(expense),
      recurring: serializeRecurring(fresh ?? item),
      duplicate: true,
    })
  }

  try {
    const already = await prisma.expense.findFirst({ where: { commitmentId: id, periodStart } })
    if (already) return duplicate(already)

    const nextDue = addFrequency(periodStart.toISOString().slice(0, 10), item.frequency)

    const [expense, recurring] = await prisma.$transaction([
      prisma.expense.create({
        data: {
          userId,
          description: item.description,
          amount: item.amount,
          category: item.category,
          // "Today" is the user's local day, not the server's.
          date: new Date(todayISOIn(user?.timezone ?? "UTC")),
          isRecurring: true,
          recurringFrequency: item.frequency,
          commitmentId: id,
          periodStart,
        },
      }),
      prisma.recurringExpense.update({ where: { id }, data: { nextDue: new Date(nextDue) } }),
    ])

    return NextResponse.json({
      expense: serializeExpense(expense),
      recurring: serializeRecurring(recurring),
    })
  } catch (error) {
    // Lost the race with a concurrent request: the unique index rejected the
    // second insert. Return the winner's row rather than a confusing error.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.expense.findFirst({ where: { commitmentId: id, periodStart } })
      if (existing) return duplicate(existing)
    }
    console.error("process recurring failed", error)
    return serverError()
  }
}
