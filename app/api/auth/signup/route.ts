import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { serverError, readJson, tooManyRequests } from "@/lib/api"
import { hashPassword } from "@/lib/auth/password"
import { startSession } from "@/lib/auth/cookies"
import { DEFAULT_CATEGORIES } from "@/lib/default-categories"
import { prisma } from "@/lib/db"
import { clientIp, rateLimit } from "@/lib/rate-limit"
import { fieldErrors, signupSchema } from "@/lib/validation"

// Signups are rare, so a tight per-IP budget costs real users nothing.
const SIGNUP_LIMIT = 5
const WINDOW_SECONDS = 60 * 60

export async function POST(request: Request) {
  const parsed = signupSchema.safeParse(await readJson(request))
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form.", fields: fieldErrors(parsed.error) }, { status: 400 })
  }
  const { name, email, password } = parsed.data

  try {
    const limit = await rateLimit(`signup:ip:${clientIp(request)}`, SIGNUP_LIMIT, WINDOW_SECONDS)
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        // Seed the default categories so a new account isn't empty.
        categories: {
          create: DEFAULT_CATEGORIES.map((category) => ({ name: category, nameLower: category.toLowerCase() })),
        },
      },
      select: { id: true, name: true, email: true, timezone: true },
    })
    await startSession({ userId: user.id, email: user.email })
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That email is already registered." }, { status: 409 })
    }
    console.error("signup failed", error)
    return serverError()
  }
}

