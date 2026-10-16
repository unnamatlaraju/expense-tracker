import { NextResponse } from "next/server"
import { badRequest, readJson, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { addFrequency } from "@/lib/format"
import { prisma } from "@/lib/db"
import { serializeExpense, serializeRecurring } from "@/lib/serialize"
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

    // Marking an expense recurring also creates the schedule entry, mirroring
    // the old localStorage behaviour.
    const recurring = recurringFrequency
      ? await prisma.recurringExpense.create({
          data: {
            userId,
            description: input.description,
            amount: input.amount,
            category: input.category,
            frequency: recurringFrequency,
            nextDue: new Date(addFrequency(input.date, recurringFrequency)),
            isActive: true,
          },
        })
      : null

    return NextResponse.json(
      { expense: serializeExpense(expense), recurring: recurring ? serializeRecurring(recurring) : null },
      { status: 201 },
    )
  } catch (error) {
    console.error("create expense failed", error)
    return serverError()
  }
}
