import { SignJWT } from "jose/jwt/sign"
import { jwtVerify } from "jose/jwt/verify"

/**
 * Sessions are stateless: a signed JWT stored in an httpOnly cookie.
 *
 * This module deliberately imports nothing from `next/headers` so it can be
 * used from the Edge runtime (i.e. `middleware.ts`). The cookie read/write
 * helpers live in `lib/auth/cookies.ts`.
 */
export const SESSION_COOKIE = "spendly_session"
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

export interface SessionPayload {
  userId: string
  email: string
}

const secret = () => {
  const value = process.env.AUTH_SECRET
  if (!value) throw new Error("AUTH_SECRET is not set. Add it to your .env file.")
  return new TextEncoder().encode(value)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret())
}

/** Returns the payload, or `null` when the token is missing, expired or tampered with. */
export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    if (typeof payload.userId !== "string" || typeof payload.email !== "string") return null
    return { userId: payload.userId, email: payload.email }
  } catch {
    return null
  }
}
