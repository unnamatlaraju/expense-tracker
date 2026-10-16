import { NextResponse } from "next/server"
import { notFound, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { advanceCommitment } from "@/lib/commitments"
import { prisma } from "@/lib/db"
import { serializeCommitment, toISODate } from "@/lib/serialize"

/**
 * "I didn't pay this one." Moves the due date on by a period *without* logging
 * an expense, so skipping a month doesn't inflate your spending history.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { userId } = session

  try {
    const item = await prisma.commitment.findFirst({ where: { id, userId } })
    if (!item) return notFound("Commitment not found.")
    if (!item.isActive) return NextResponse.json({ error: "This commitment is paused." }, { status: 400 })

    const advance = advanceCommitment({
      nextDue: toISODate(item.nextDue),
      frequency: item.frequency,
      endDate: item.endDate ? toISODate(item.endDate) : null,
    })

    const commitment = await prisma.commitment.update({
      where: { id },
      data: { nextDue: new Date(advance.nextDue), isActive: advance.isActive },
    })

    return NextResponse.json({ commitment: serializeCommitment(commitment), skipped: true })
  } catch (error) {
    console.error("skip commitment failed", error)
    return serverError()
  }
}
