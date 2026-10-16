import Link from "next/link"
import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#commitments", label: "Commitments" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
]

/** Sticky translucent bar at the top of the public landing page. */
export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-xl">
          <span className="bg-aurora glow grid size-9 place-items-center rounded-xl">
            <Wallet className="size-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">Spendly</span>
        </Link>

        <nav aria-label="Sections" className="ml-6 hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
