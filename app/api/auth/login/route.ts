import { NextResponse } from "next/server"
import { readJson, serverError, tooManyRequests } from "@/lib/api"
import { startSession } from "@/lib/auth/cookies"
import { verifyPassword } from "@/lib/auth/password"
import { prisma } from "@/lib/db"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { fieldErrors, loginSchema } from "@/lib/validation"

const INVALID = "Email or password is incorrect."

// A real (but unusable) hash so unknown emails still pay the bcrypt cost.
const DUMMY_HASH = "$2b$12$bfD6soEFIq7UIjlhKKoJLuYh66GFSm7ehowWzV7faC6Dn5AIPWuAS"

// Per-window budgets. IP stops one machine hammering us; the email key stops a
// distributed attack from spreading attempts across many IPs for one account.
const IP_LIMIT = 10
const EMAIL_LIMIT = 10
const WINDOW_SECONDS = 5 * 60

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form.", fields: fieldErrors(parsed.error) }, { status: 400 })
  }
  const { email, password } = parsed.data

  try {
    const [byIp, byEmail] = await Promise.all([
      rateLimit(`login:ip:${clientIp(request)}`, IP_LIMIT, WINDOW_SECONDS),
      rateLimit(`login:email:${email}`, EMAIL_LIMIT, WINDOW_SECONDS),
    ])
    if (!byIp.ok || !byEmail.ok) {
      return tooManyRequests(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds))
    }

    const user = await prisma.user.findUnique({ where: { email } })
    // Always run a comparison so a missing user and a wrong password take a
    // similar amount of time (avoids leaking which emails exist).
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)
    if (!user || !ok) return NextResponse.json({ error: INVALID }, { status: 401 })

    await startSession({ userId: user.id, email: user.email })
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    console.error("login failed", error)
    return serverError()
  }
}
