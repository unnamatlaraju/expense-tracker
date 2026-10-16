import { NextResponse } from "next/server"
import { notFound, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { prisma } from "@/lib/db"

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
