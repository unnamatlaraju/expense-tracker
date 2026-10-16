import { NextResponse } from "next/server"
import { badRequest, readJson, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { prisma } from "@/lib/db"
import { serializeBudget } from "@/lib/serialize"
import { budgetSchema } from "@/lib/validation"

/** Upsert: setting a budget for a category creates it or updates the limit. */
export async function PUT(request: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const parsed = budgetSchema.safeParse(await readJson(request))
  if (!parsed.success) return badRequest(parsed.error)

  const { userId } = session
  const { category, limit } = parsed.data

  try {
    const budget = await prisma.budget.upsert({
      where: { userId_category: { userId, category } },
      create: { userId, category, limit },
      update: { limit },
    })
    return NextResponse.json({ budget: serializeBudget(budget) })
  } catch (error) {
    console.error("set budget failed", error)
    return serverError()
  }
}
