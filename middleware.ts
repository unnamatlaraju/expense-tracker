import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session"

/**
 * Gate the app pages behind a session.
 *
 *   - No session + a private page  -> redirect to /login (remembering where
 *     the user was headed).
 *   - Session + an auth page       -> redirect home.
 *
 * `/api/*` is excluded from the matcher below: those handlers return 401 JSON
 * themselves, which is friendlier for `fetch` than an HTML redirect.
 */
const AUTH_PAGES = ["/login", "/signup"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)
  const isAuthPage = AUTH_PAGES.includes(pathname)

  if (!session && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    if (pathname !== "/") url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  if (session && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
}
