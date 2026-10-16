import { NextResponse } from "next/server"
import { badRequest, readJson, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { prisma } from "@/lib/db"
import { updateMeSchema } from "@/lib/validation"

const USER_SELECT = { id: true, name: true, email: true, timezone: true } as const

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
