import { NextResponse } from "next/server"
import { badRequest, readJson, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { addFrequency } from "@/lib/format"
import { prisma } from "@/lib/db"
import { serializeCommitment, serializeExpense } from "@/lib/serialize"
import { newExpenseSchema } from "@/lib/validation"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const parsed = newExpenseSchema.safeParse(await readJson(request))
  if (!parsed.success) return badRequest(parsed.error)

  const { recurringFrequency, ...input } = parsed.data
  const { userId } = session

  try {
    const expense = await prisma.expense.create({
      data: {
        userId,
        description: input.description,
        amount: input.amount,
        category: input.category,
        // `new Date("YYYY-MM-DD")` is UTC midnight, which matches a @db.Date column.
        date: new Date(input.date),
        isRecurring: Boolean(recurringFrequency),
        recurringFrequency,
      },
    })

    // "Repeat this expense" also creates the commitment, so it shows up on the
    // Commitments page. Kind is unknown from this path, hence "other".
    const commitment = recurringFrequency
      ? await prisma.commitment.create({
          data: {
            userId,
            description: input.description,
            amount: input.amount,
            category: input.category,
            frequency: recurringFrequency,
            kind: "other",
            nextDue: new Date(addFrequency(input.date, recurringFrequency)),
            isActive: true,
          },
        })
      : null

    return NextResponse.json(
      { expense: serializeExpense(expense), commitment: commitment ? serializeCommitment(commitment) : null },
      { status: 201 },
    )
  } catch (error) {
    console.error("create expense failed", error)
    return serverError()
  }
}
