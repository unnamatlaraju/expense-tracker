import type { ReactNode } from "react"
import { AuroraBackground } from "@/components/aurora-background"

/** Public marketing area (the landing page). No app chrome and no user data. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuroraBackground />
      <div className="relative">{children}</div>
    </>
  )
}
