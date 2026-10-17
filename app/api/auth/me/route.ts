import { NextResponse } from "next/server"
import { badRequest, readJson, serverError, tooManyRequests, unauthorized } from "@/lib/api"
import { endSession, getSession } from "@/lib/auth/cookies"
import { verifyPassword } from "@/lib/auth/password"
import { prisma } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { deleteAccountSchema, updateMeSchema } from "@/lib/validation"

const USER_SELECT = { id: true, name: true, email: true, timezone: true } as const

// The delete prompt re-authenticates, so it is also a password-guessing oracle
// for anyone holding a session. Bound the attempts per account.
const DELETE_LIMIT = 5
const DELETE_WINDOW_SECONDS = 15 * 60

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: USER_SELECT })
  return NextResponse.json({ user })
}

/**
 * Updates the current user's settings. Today this only holds the timezone,
 * which the client keeps in sync so the server can compute the user's local
 * "today" (see `todayISOIn`) instead of using its own clock.
 */
export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const parsed = updateMeSchema.safeParse(await readJson(request))
  if (!parsed.success) return badRequest(parsed.error)

  try {
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { timezone: parsed.data.timezone },
      select: USER_SELECT,
    })
    return NextResponse.json({ user })
  } catch (error) {
    console.error("update me failed", error)
    return serverError()
  }
}

/**
 * Permanently deletes the account and everything it owns.
 *
 * Re-authenticated on purpose: a lost or borrowed unlocked laptop should not be
 * one click away from destroying someone's entire financial history. Every
 * child row (expenses, categories, budgets, commitments) is removed by the
 * `onDelete: Cascade` rules in the schema, so there is no list of tables to
 * keep in sync here.
 */
export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const parsed = deleteAccountSchema.safeParse(await readJson(request))
  if (!parsed.success) return badRequest(parsed.error)

  try {
    const limited = await rateLimit(`delete:user:${session.userId}`, DELETE_LIMIT, DELETE_WINDOW_SECONDS)
    if (!limited.ok) return tooManyRequests(limited.retryAfterSeconds)

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    })

    // Already gone — deleted in another tab, say. Clearing the cookie and
    // reporting success gets the client to a sensible place either way.
    if (!user) {
      await endSession()
      return NextResponse.json({ ok: true })
    }

    if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json(
        { error: "That password is incorrect.", fields: { password: "That password is incorrect." } },
        { status: 401 },
      )
    }

    await prisma.user.delete({ where: { id: session.userId } })
    await endSession()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("delete account failed", error)
    return serverError()
  }
}
