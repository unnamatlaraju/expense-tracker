import type { Metadata, Viewport } from "next"
import { Sora } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" })

const SITE_TITLE = "Spendly — Track daily expenses, bills & subscriptions"
const SITE_DESCRIPTION =
  "A free expense tracker for daily spending, budgets and recurring commitments — rent, EMIs, utilities and subscriptions. See exactly where your money goes."

/**
 * Absolute URLs are required for canonical links and social preview images.
 * `VERCEL_PROJECT_PRODUCTION_URL` is provided automatically on Vercel, so the
 * deployed domain is picked up without hardcoding it; `NEXT_PUBLIC_SITE_URL`
 * overrides that if a custom domain is ever added. A malformed value is
 * ignored rather than failing the build.
 */
function resolveSiteUrl() {
  const override = process.env.NEXT_PUBLIC_SITE_URL
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  for (const candidate of [override, vercel ? `https://${vercel}` : undefined]) {
    if (!candidate) continue
    try {
      return new URL(candidate)
    } catch {
      // Fall through to the next candidate.
    }
  }
  return new URL("http://localhost:3000")
}

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: { default: SITE_TITLE, template: "%s · Spendly" },
  description: SITE_DESCRIPTION,
  applicationName: "Spendly",
  // Kept here rather than on the landing page: a page-level `openGraph` block
  // replaces this one and drops the generated `opengraph-image` with it.
  openGraph: {
    type: "website",
    siteName: "Spendly",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
}

export const viewport: Viewport = {
  themeColor: "#07071a",
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} font-sans`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
