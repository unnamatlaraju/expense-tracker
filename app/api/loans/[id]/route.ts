import type { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { badRequest, notFound, readJson, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { prisma } from "@/lib/db"
import { serializeLoan } from "@/lib/serialize"
import { updateLoanSchema } from "@/lib/validation"

/**
 * Edits a loan's terms. Every derived figure (EMI, schedule, interest, payoff
 * date) is recomputed from these fields on the client, so there is nothing else
 * to keep in sync here.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const parsed = updateLoanSchema.safeParse(await readJson(request))
  if (!parsed.success) return badRequest(parsed.error)

  const { id } = await params
  const patch = parsed.data

  const data: Prisma.LoanUncheckedUpdateInput = {}
  if (patch.name !== undefined) data.name = patch.name
  if (patch.lender !== undefined) data.lender = patch.lender || null
  if (patch.principal !== undefined) data.principal = patch.principal
  if (patch.annualRate !== undefined) data.annualRate = patch.annualRate
  if (patch.tenureMonths !== undefined) data.tenureMonths = patch.tenureMonths
  if (patch.firstDue !== undefined) data.firstDue = new Date(patch.firstDue)
  if (patch.notes !== undefined) data.notes = patch.notes

  try {
    // Scoped by userId, so editing someone else's loan is a 404, not a 200.
    const { count } = await prisma.loan.updateMany({ where: { id, userId: session.userId }, data })
    if (count === 0) return notFound("Loan not found.")

    const loan = await prisma.loan.findUnique({ where: { id } })
    if (!loan) return notFound("Loan not found.")
    return NextResponse.json({ loan: serializeLoan(loan) })
  } catch (error) {
    console.error("update loan failed", error)
    return serverError()
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  try {
    const { count } = await prisma.loan.deleteMany({ where: { id, userId: session.userId } })
    if (count === 0) return notFound("Loan not found.")
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("delete loan failed", error)
    return serverError()
  }
}
