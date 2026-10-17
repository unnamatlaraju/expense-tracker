import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session"
import { APP_HOME } from "@/lib/navigation"

/**
 * Gate the app pages behind a session, and keep signed-in users out of the
 * marketing/auth pages.
 *
 *   - No session + a private page   -> redirect to /login (remembering where the
 *     user was headed).
 *   - Session + the landing page    -> redirect to the dashboard, so the
 *     marketing page is only ever seen by visitors.
 *   - Session + an auth page        -> redirect to the dashboard.
 *
 * `/api/*` is excluded from the matcher below: those handlers return 401 JSON
 * themselves, which is friendlier for `fetch` than an HTML redirect.
 */
const PUBLIC_PAGES = ["/", "/login", "/signup"]
const AUTH_PAGES = ["/login", "/signup"]

/**
 * Next generates the favicon and the social-preview image as routes, and the
 * installable web app needs its manifest icons. Crawlers and browsers fetching
 * these have no session cookie, so they must stay public — otherwise they would
 * be handed the login page's HTML instead of the image.
 *
 * (`/manifest.webmanifest` and `/sw.js` contain a dot, so the matcher already
 * skips them.)
 */
const METADATA_ROUTES = /^\/(opengraph-image|twitter-image|icon|apple-icon|icons)(\/|$)/

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)
  const isPublicPage = PUBLIC_PAGES.includes(pathname)
  const isAuthPage = AUTH_PAGES.includes(pathname)
  const isMetadataRoute = METADATA_ROUTES.test(pathname)

  if (!session && !isPublicPage && !isMetadataRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    if (pathname !== APP_HOME) url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  if (session && (isAuthPage || pathname === "/")) {
    const url = request.nextUrl.clone()
    url.pathname = APP_HOME
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
}
