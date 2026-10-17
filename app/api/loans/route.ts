import { NextResponse } from "next/server"
import { badRequest, readJson, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { prisma } from "@/lib/db"
import { serializeLoan } from "@/lib/serialize"
import { newLoanSchema } from "@/lib/validation"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const parsed = newLoanSchema.safeParse(await readJson(request))
  if (!parsed.success) return badRequest(parsed.error)

  const input = parsed.data

  try {
    const loan = await prisma.loan.create({
      data: {
        userId: session.userId,
        name: input.name,
        lender: input.lender || null,
        principal: input.principal,
        annualRate: input.annualRate,
        tenureMonths: input.tenureMonths,
        // `new Date("YYYY-MM-DD")` is UTC midnight, which matches a @db.Date column.
        firstDue: new Date(input.firstDue),
        notes: input.notes || null,
      },
    })

    return NextResponse.json({ loan: serializeLoan(loan) }, { status: 201 })
  } catch (error) {
    console.error("create loan failed", error)
    return serverError()
  }
}
