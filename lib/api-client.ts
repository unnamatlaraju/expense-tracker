"use client"

/**
 * Thin wrapper around `fetch` for talking to the Spendly API from the browser.
 * Normalises errors into `ApiError` and bounces to /login when the session has
 * expired (the middleware can't do that for `fetch` calls).
 */
export class ApiError extends Error {
  status: number
  fields?: Record<string, string>

  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fields = fields
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })

  if (response.status === 401 && typeof window !== "undefined" && !path.startsWith("/api/auth/")) {
    // The cookie is present but the server rejected it — the session expired, or
    // the account no longer exists. Clear it *before* navigating: otherwise the
    // middleware still sees a "valid" cookie and bounces us straight back here,
    // which loops forever.
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    window.location.href = "/login"
    throw new ApiError("Your session has expired. Please sign in again.", 401)
  }

  const data = (await response.json().catch(() => null)) as
    | (T & { error?: string; fields?: Record<string, string> })
    | null

  if (!response.ok) {
    throw new ApiError(data?.error ?? "Request failed.", response.status, data?.fields)
  }
  return data as T
}
