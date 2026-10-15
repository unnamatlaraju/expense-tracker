"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldCheck, Wallet } from "lucide-react"
import type { ReactNode } from "react"
import { getActiveNavIndex, NAV_ITEMS } from "@/components/nav"
import { formatCurrencyWhole, monthKey, todayISO } from "@/lib/format"
import { useExpenseStore } from "@/lib/store"
import { cn } from "@/lib/utils"

function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-aurora absolute -top-36 -left-32 size-[32rem] rounded-full bg-[#7c3aed] opacity-50 blur-[90px]" />
      <div className="animate-aurora absolute -right-24 -bottom-40 size-[28rem] rounded-full bg-[#ec4899] opacity-40 blur-[90px] [animation-delay:-6s]" />
      <div className="animate-aurora absolute top-1/3 left-1/2 size-[22rem] rounded-full bg-[#06b6d4] opacity-20 blur-[90px] [animation-delay:-12s]" />
    </div>
  )
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-xl">
      <span className="bg-aurora glow grid size-9 place-items-center rounded-xl">
        <Wallet className="size-5 text-white" />
      </span>
      <span className="text-lg font-bold tracking-tight">Spendly</span>
    </Link>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-80 rounded-3xl" />
      <div className="skeleton h-80 rounded-3xl" />
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { isLoaded, expenses } = useExpenseStore()
  const active = getActiveNavIndex(pathname)
  const page = NAV_ITEMS[active]

  const currentMonth = monthKey(todayISO())
  const monthTotal = expenses
    .filter((e) => monthKey(e.date) === currentMonth)
    .reduce((sum, e) => sum + e.amount, 0)
  const monthTotalLabel = isLoaded ? formatCurrencyWhole(monthTotal) : "…"

  return (
    <>
      <AuroraBackground />

      {/* Desktop sidebar */}
      <aside className="glass fixed inset-y-4 left-4 z-30 hidden w-64 flex-col rounded-3xl p-5 lg:flex">
        <Logo />
        <nav aria-label="Main" className="relative mt-10 flex flex-col gap-1.5">
          {active >= 0 && (
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-11 rounded-xl bg-primary/20 ring-1 ring-primary/40 ring-inset transition-transform duration-500 ease-out-expo"
              style={{ transform: `translateY(${active * 50}px)` }}
            />
          )}
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={i === active ? "page" : undefined}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground",
                i === active && "text-foreground",
              )}
            >
              <item.icon className={cn("size-[18px] transition-colors duration-300", i === active && "text-[#d8b4fe]")} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-4">
          <div className="bg-aurora glow relative overflow-hidden rounded-2xl p-4 text-white">
            <p className="text-xs text-white/80">Spent this month</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">{monthTotalLabel}</p>
            <span aria-hidden className="absolute -right-8 -bottom-10 size-28 rounded-full bg-white/20 blur-2xl" />
          </div>
          <p className="flex items-start gap-2 px-1 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            Your data is saved in this browser only.
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-background/60 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Logo />
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground">
          This month <span className="font-semibold text-foreground tabular-nums">{monthTotalLabel}</span>
        </span>
      </header>

      <div className="lg:pl-72">
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-32 sm:px-6 lg:px-8 lg:pt-10 lg:pb-12">
          <div key={pathname} className="animate-view-in">
            {page && (
              <header className="mb-6 lg:mb-8">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{page.title}</h1>
                <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{page.description}</p>
              </header>
            )}
            {isLoaded ? children : <LoadingSkeleton />}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Main"
        className="glass fixed inset-x-3 bottom-3 z-30 rounded-2xl bg-[#14142e]/85! p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] lg:hidden"
      >
        <div className="relative grid grid-cols-5">
          {active >= 0 && (
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-1/5 transition-transform duration-500 ease-out-expo"
              style={{ transform: `translateX(${active * 100}%)` }}
            >
              <span className="block size-full rounded-xl bg-primary/20 ring-1 ring-primary/40 ring-inset" />
            </span>
          )}
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={i === active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium text-muted-foreground transition-colors duration-300",
                i === active && "text-foreground",
              )}
            >
              <item.icon className={cn("size-5 transition-transform duration-500 ease-out-expo", i === active && "-translate-y-0.5 text-[#d8b4fe]")} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
