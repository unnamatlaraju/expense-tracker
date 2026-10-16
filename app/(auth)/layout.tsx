import type { ReactNode } from "react"
import { AuroraBackground } from "@/components/aurora-background"

/** Public area (login / signup): just the background and a centered card. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuroraBackground />
      <main className="grid min-h-dvh place-items-center px-4 py-10">{children}</main>
    </>
  )
}
