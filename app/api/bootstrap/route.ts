import { NextResponse } from "next/server"
import { serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { prisma } from "@/lib/db"
import { serializeBudget, serializeCommitment, serializeExpense, serializeLoan } from "@/lib/serialize"

/**
 * One request to hydrate the whole client store (expenses, categories, budgets,
 * commitments, loans). Keeps the store's initial load to a single round-trip.
 */
export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()
  const { userId } = session

  try {
    const [user, expenses, categories, budgets, commitments, loans] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, timezone: true } }),
      prisma.expense.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      prisma.category.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      prisma.budget.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      prisma.commitment.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      prisma.loan.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    ])

    if (!user) return unauthorized()

    return NextResponse.json({
      user,
      expenses: expenses.map(serializeExpense),
      categories: categories.map((c) => c.name),
      budgets: budgets.map(serializeBudget),
      commitments: commitments.map(serializeCommitment),
      loans: loans.map(serializeLoan),
    })
  } catch (error) {
    console.error("bootstrap failed", error)
    return serverError()
  }
}
