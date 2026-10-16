/** The signed-in home of the app (the landing page lives at `/`). */
export const APP_HOME = "/dashboard"

/**
 * Validate a `?next=` destination before sending the browser there.
 *
 * Only rooted, same-site paths are allowed. `//evil.com` is rejected because a
 * browser reads it as a protocol-relative URL for another host, which would
 * otherwise turn the login form into an open redirect.
 */
export function safeNextPath(value: string | undefined | null, fallback: string = APP_HOME): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback
  return value
}
