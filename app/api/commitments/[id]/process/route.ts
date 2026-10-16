import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { notFound, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { advanceCommitment } from "@/lib/commitments"
import { todayISOIn } from "@/lib/format"
import { prisma } from "@/lib/db"
import { serializeCommitment, serializeExpense, toISODate } from "@/lib/serialize"
import type { Expense } from "@prisma/client"

/**
 * Logs this period's payment as an expense and rolls `nextDue` forward.
 *
 * Idempotent: each expense is tagged with the commitment it came from and the
 * period it covers, and a unique index on that pair means a double-click (two
 * in-flight requests that both read the same `nextDue`) can never log the same
 * period twice. The loser of the race returns the winner's row. Both writes
 * share one transaction so the expense and the advanced due date can't drift.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { userId } = session

  const [item, user] = await Promise.all([
    prisma.commitment.findFirst({ where: { id, userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
  ]).catch((error) => {
    console.error("process commitment lookup failed", error)
    return [null, null] as const
  })

  if (!item) return notFound("Commitment not found.")
  if (!item.isActive) return NextResponse.json({ error: "This commitment is paused." }, { status: 400 })

  // The period this call covers is whatever was due when we read the record.
  const periodStart = item.nextDue

  const duplicate = async (expense: Expense) => {
    const fresh = await prisma.commitment.findFirst({ where: { id, userId } })
    return NextResponse.json({
      expense: serializeExpense(expense),
      commitment: serializeCommitment(fresh ?? item),
      duplicate: true,
    })
  }

  const advance = advanceCommitment({
    nextDue: toISODate(item.nextDue),
    frequency: item.frequency,
    endDate: item.endDate ? toISODate(item.endDate) : null,
  })

  try {
    const already = await prisma.expense.findFirst({ where: { commitmentId: id, periodStart } })
    if (already) return duplicate(already)

    const [expense, commitment] = await prisma.$transaction([
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
      prisma.commitment.update({
        where: { id },
        // `isActive` goes false on the last period, once the next one would
        // fall past the end date.
        data: { nextDue: new Date(advance.nextDue), isActive: advance.isActive },
      }),
    ])

    return NextResponse.json({
      expense: serializeExpense(expense),
      commitment: serializeCommitment(commitment),
    })
  } catch (error) {
    // Lost the race with a concurrent request: the unique index rejected the
    // second insert. Return the winner's row rather than a confusing error.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.expense.findFirst({ where: { commitmentId: id, periodStart } })
      if (existing) return duplicate(existing)
    }
    console.error("process commitment failed", error)
    return serverError()
  }
}
