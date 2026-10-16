import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { badRequest, readJson, serverError, unauthorized } from "@/lib/api"
import { getSession } from "@/lib/auth/cookies"
import { prisma } from "@/lib/db"
import { categorySchema } from "@/lib/validation"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return unauthorized()

  const parsed = categorySchema.safeParse(await readJson(request))
  if (!parsed.success) return badRequest(parsed.error)

  const { userId } = session
  const { name } = parsed.data
  const nameLower = name.toLowerCase()

  try {
    // Friendly check first, so the common case gets a nice message. It can't be
    // the only guard though — two requests can both pass it before either
    // inserts. The `@@unique([userId, nameLower])` index is what actually
    // guarantees uniqueness; concurrent losers surface as P2002 below.
    const existing = await prisma.category.findFirst({ where: { userId, nameLower } })
    if (existing) return NextResponse.json({ error: `"${existing.name}" already exists.` }, { status: 409 })

    const category = await prisma.category.create({ data: { userId, name, nameLower } })
    return NextResponse.json({ name: category.name }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: `"${name}" already exists.` }, { status: 409 })
    }
    console.error("create category failed", error)
    return serverError()
  }
}
