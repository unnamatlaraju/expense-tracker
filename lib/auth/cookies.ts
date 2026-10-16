import { cookies } from "next/headers"
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, signSession, verifySession, type SessionPayload } from "@/lib/auth/session"

/**
 * Cookie helpers for route handlers. `cookies()` is async in Next 15. These
 * must not be imported by `middleware.ts` (which reads the cookie straight off
 * the request instead).
 */
export async function startSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function endSession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  return verifySession(store.get(SESSION_COOKIE)?.value)
}
