import type { Metadata, Viewport } from "next"
import { Sora } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" })

export const metadata: Metadata = {
  title: { default: "Spendly · Expense Tracker", template: "%s · Spendly" },
  description: "Track daily expenses, budgets and recurring payments",
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
