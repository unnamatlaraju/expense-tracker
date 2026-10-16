import { NextResponse } from "next/server"
import { badRequest, readJson, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { prisma } from "@/lib/db"
import { serializeCommitment } from "@/lib/serialize"
import { newCommitmentSchema } from "@/lib/validation"

/** Creates a commitment directly (bills you know about before you pay them). */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const parsed = newCommitmentSchema.safeParse(await readJson(request))
  if (!parsed.success) return badRequest(parsed.error)

  const input = parsed.data

  try {
    const commitment = await prisma.commitment.create({
      data: {
        userId: session.userId,
        description: input.description,
        amount: input.amount,
        category: input.category,
        frequency: input.frequency,
        kind: input.kind,
        nextDue: new Date(input.nextDue),
        remindersEnabled: input.remindersEnabled,
        remindDaysBefore: input.remindDaysBefore,
        endDate: input.endDate ? new Date(input.endDate) : null,
        autopay: input.autopay,
        notes: input.notes ?? null,
      },
    })
    return NextResponse.json({ commitment: serializeCommitment(commitment) }, { status: 201 })
  } catch (error) {
    console.error("create commitment failed", error)
    return serverError()
  }
}
