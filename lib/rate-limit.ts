import { prisma } from "@/lib/db"

/**
 * Fixed-window rate limiter backed by Postgres.
 *
 * Why the database instead of an in-memory `Map`: the app runs on multiple
 * serverless instances, so a process-local counter gives an attacker a fresh
 * budget on every instance and resets on every cold start — i.e. it doesn't
 * really limit anything. A single atomic upsert keeps one shared counter and
 * closes the read-then-write race that a SELECT-then-UPDATE would leave open.
 */

export interface RateLimitResult {
  /** `false` when the caller has exceeded the limit for this window. */
  ok: boolean
  remaining: number
  /** Seconds until the current window ends (for a `Retry-After` header). */
  retryAfterSeconds: number
}

export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const windowEnd = new Date(Date.now() + windowSeconds * 1000)

  const rows = await prisma.$queryRaw<{ count: number; windowEnd: Date }[]>`
    INSERT INTO "RateLimit" ("id", "key", "count", "windowEnd")
    VALUES (gen_random_uuid()::text, ${key}, 1, ${windowEnd})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowEnd" <= now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowEnd" = CASE WHEN "RateLimit"."windowEnd" <= now() THEN ${windowEnd} ELSE "RateLimit"."windowEnd" END
    RETURNING "count", "windowEnd"
  `

  const row = rows[0]
  const count = Number(row?.count ?? 1)
  const endsAt = row?.windowEnd ? new Date(row.windowEnd) : windowEnd
  const retryAfterSeconds = Math.max(1, Math.ceil((endsAt.getTime() - Date.now()) / 1000))

  // A window just (re)started — a cheap moment to sweep rows nobody will hit again.
  if (count === 1) void cleanupExpiredRateLimits()

  return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfterSeconds }
}

/** Deletes windows that ended over a day ago. Best-effort maintenance only. */
export const cleanupExpiredRateLimits = async () => {
  try {
    await prisma.rateLimit.deleteMany({
      where: { windowEnd: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    })
  } catch {
    // Never let background cleanup break the request it piggybacks on.
  }
}

/**
 * Best-effort client IP.
 *
 * `x-real-ip` is a single value set by the platform (Vercel sets it), so it is
 * preferred. Otherwise we take the first hop of `x-forwarded-for`. Note that
 * the IP is only a coarse control — a spoofable/rotating IP can't get past the
 * per-account limit that the auth routes apply alongside it. When no header is
 * present (e.g. local dev) everyone shares one bucket, which fails *closed*.
 */
export const clientIp = (request: Request) => {
  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown"
  return "unknown"
}
