import type { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { badRequest, notFound, readJson, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { prisma } from "@/lib/db"
import { serializeCommitment, toISODate } from "@/lib/serialize"
import { updateCommitmentSchema } from "@/lib/validation"

/** Partial update. Only the fields actually sent are written. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const parsed = updateCommitmentSchema.safeParse(await readJson(request))
  if (!parsed.success) return badRequest(parsed.error)

  try {
    const current = await prisma.commitment.findFirst({ where: { id, userId: session.userId } })
    if (!current) return notFound("Commitment not found.")

    const patch = parsed.data

    // Cross-field rule that needs the stored row: the end date can never sit
    // before the due date, whether the caller moved one of them or both.
    const nextDue = patch.nextDue ?? toISODate(current.nextDue)
    const endDate =
      patch.endDate === undefined ? (current.endDate ? toISODate(current.endDate) : null) : patch.endDate
    if (endDate && endDate < nextDue) {
      return NextResponse.json(
        {
          error: "Please check the form.",
          fields: { endDate: "End date must be on or after the next due date" },
        },
        { status: 400 },
      )
    }

    const data: Prisma.CommitmentUncheckedUpdateInput = {}
    if (patch.description !== undefined) data.description = patch.description
    if (patch.amount !== undefined) data.amount = patch.amount
    if (patch.category !== undefined) data.category = patch.category
    if (patch.frequency !== undefined) data.frequency = patch.frequency
    if (patch.kind !== undefined) data.kind = patch.kind
    if (patch.nextDue !== undefined) data.nextDue = new Date(patch.nextDue)
    if (patch.isActive !== undefined) data.isActive = patch.isActive
    if (patch.remindersEnabled !== undefined) data.remindersEnabled = patch.remindersEnabled
    if (patch.remindDaysBefore !== undefined) data.remindDaysBefore = patch.remindDaysBefore
    if (patch.endDate !== undefined) data.endDate = patch.endDate ? new Date(patch.endDate) : null
    if (patch.autopay !== undefined) data.autopay = patch.autopay
    if (patch.notes !== undefined) data.notes = patch.notes

    const commitment = await prisma.commitment.update({ where: { id }, data })
    return NextResponse.json({ commitment: serializeCommitment(commitment) })
  } catch (error) {
    console.error("update commitment failed", error)
    return serverError()
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  try {
    // Scoped by userId, so deleting someone else's row is a 404 rather than a 200.
    const { count } = await prisma.commitment.deleteMany({ where: { id, userId: session.userId } })
    if (count === 0) return notFound("Commitment not found.")
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("delete commitment failed", error)
    return serverError()
  }
}
