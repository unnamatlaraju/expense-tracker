import { NextResponse } from "next/server"
import { notFound, readJson, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { prisma } from "@/lib/db"
import { serializeRecurring } from "@/lib/serialize"

/**
 * PATCH pauses or resumes a schedule. Send `{ isActive: boolean }`, or no body
 * to simply flip the current state.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const body = (await readJson(request)) as { isActive?: unknown } | null

  try {
    const current = await prisma.recurringExpense.findFirst({ where: { id, userId: session.userId } })
    if (!current) return notFound("Recurring expense not found.")

    const isActive = typeof body?.isActive === "boolean" ? body.isActive : !current.isActive
    const recurring = await prisma.recurringExpense.update({ where: { id }, data: { isActive } })
    return NextResponse.json({ recurring: serializeRecurring(recurring) })
  } catch (error) {
    console.error("toggle recurring failed", error)
    return serverError()
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  try {
    const { count } = await prisma.recurringExpense.deleteMany({ where: { id, userId: session.userId } })
    if (count === 0) return notFound("Recurring expense not found.")
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("delete recurring failed", error)
    return serverError()
  }
}
