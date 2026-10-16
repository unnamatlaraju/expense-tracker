import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  ChartPie,
  Download,
  Lock,
  Mic,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react"
import { AppPreview } from "@/components/landing/app-preview"
import { MarketingNav } from "@/components/landing/marketing-nav"
import { Reveal } from "@/components/landing/reveal"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  // The title and description come from the root layout, since this page *is*
  // the site's default. Setting them here would also shadow the generated
  // social-preview image.
  alternates: { canonical: "/" },
}

const FEATURES = [
  {
    icon: Receipt,
    title: "Log spending in seconds",
    body: "Type an amount, pick a category, done. Everyday purchases stay a two-tap habit, not a chore.",
  },
  {
    icon: Mic,
    title: "Add by voice",
    body: "Say “180 rupees lunch” and Spendly fills in the amount, category and date for you.",
  },
  {
    icon: Target,
    title: "Budgets that hold you",
    body: "Set a monthly limit per category and watch the progress bars fill up — before you overshoot.",
  },
  {
    icon: CalendarClock,
    title: "Bills, EMIs & subscriptions",
    body: "Track every recurring payment on its own schedule, weekly, monthly or yearly.",
  },
  {
    icon: BellRing,
    title: "Never miss a due date",
    body: "See what's overdue, what's due this week and what's coming next, the moment you open the app.",
  },
  {
    icon: ChartPie,
    title: "Know where it went",
    body: "Category breakdowns and six-month trends turn a pile of receipts into an actual picture.",
  },
]

const STEPS = [
  {
    step: "01",
    title: "Create a free account",
    body: "Email and a password. No card, no bank connection, nothing to link.",
  },
  {
    step: "02",
    title: "Add what you spend",
    body: "Start with today's expenses. Spendly groups them by category as you go.",
  },
  {
    step: "03",
    title: "Add your commitments",
    body: "Rent, the electricity bill, your EMI, Netflix. Spendly keeps the dates in view.",
  },
]

const FAQ = [
  {
    q: "Is Spendly really free?",
    a: "Yes. Create an account, track as many expenses, budgets and commitments as you like.",
  },
  {
    q: "Do I have to connect my bank?",
    a: "No. Spendly never asks for bank or card details. You add expenses yourself, by typing or by voice.",
  },
  {
    q: "What counts as a commitment?",
    a: "Anything you pay on a schedule: rent, utilities, EMIs, insurance, streaming subscriptions. Mark one paid and the next due date is set automatically.",
  },
  {
    q: "What can I do with my data?",
    a: "Everything is yours. Filter your expenses in Reports and download them as a CSV whenever you want.",
  },
  {
    q: "Who else can see my expenses?",
    a: "Nobody. Every record is scoped to your account, so another user can never read or edit it.",
  },
]

const TRUST = [
  { icon: Lock, label: "Passwords hashed with bcrypt" },
  { icon: ShieldCheck, label: "Signed, httpOnly session cookies" },
  { icon: Download, label: "Your data, exportable anytime" },
]

export default function LandingPage() {
  return (
    <>
      <MarketingNav />

      <main id="top" className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ---------------------------------------------------------------- hero */}
        <section className="grid items-center gap-14 pt-16 pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-24 lg:pb-28">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground/80">
                <Sparkles className="size-3.5 text-primary" />
                Expenses · Budgets · Bills in one place
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Know exactly where your <span className="text-aurora">money</span> goes.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Spendly tracks your daily expenses, keeps your budgets honest, and remembers every
                bill, EMI and subscription — so nothing sneaks past you at the end of the month.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/signup">
                    Create your free account
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">I already have an account</Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <ul className="mt-8 flex flex-col gap-2.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
                {TRUST.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    <item.icon className="size-4 text-primary" />
                    {item.label}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={200} className="lg:pl-4">
            <AppPreview />
          </Reveal>
        </section>

        {/* ------------------------------------------------------------ features */}
        <section id="features" className="scroll-mt-24 py-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Features</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              A tracker that covers the whole month, not just today
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Most expense apps stop at “how much did I spend”. Spendly also watches the payments
              you already know are coming.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 70}>
                <div className="glass h-full rounded-3xl p-6 transition-colors duration-300 hover:border-white/20">
                  <span className="bg-aurora grid size-11 place-items-center rounded-2xl">
                    <feature.icon className="size-5 text-white" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------- commitments */}
        <section id="commitments" className="scroll-mt-24 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                Commitments
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                The bills you can’t afford to forget
              </h2>
              <p className="mt-4 text-muted-foreground">
                Rent, utilities, EMIs, insurance, subscriptions — each one gets a schedule. Spendly
                sorts them into overdue, due soon and upcoming, then moves the date forward the
                moment you mark one paid.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  "Weekly, monthly and yearly schedules",
                  "Pause a subscription instead of deleting it",
                  "End date support for loans and EMIs",
                  "Mark paid logs the expense and advances the due date in one go",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-muted-foreground">
                    <span className="bg-aurora mt-1.5 size-1.5 shrink-0 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={120}>
              <div className="glass rounded-3xl p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">This month’s commitments</p>
                  <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    4 active
                  </span>
                </div>
                <div className="mt-4 space-y-2.5">
                  {[
                    { label: "House rent", amount: "₹12,000", when: "2 days overdue", tone: "late" },
                    { label: "Electricity bill", amount: "₹1,240", when: "Due in 2 days", tone: "soon" },
                    { label: "Netflix", amount: "₹649", when: "Due in 6 days", tone: "ok" },
                    { label: "Bike EMI", amount: "₹3,450", when: "Due in 12 days", tone: "ok" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3"
                    >
                      <span
                        aria-hidden
                        className={
                          "size-2 shrink-0 rounded-full " +
                          (row.tone === "late"
                            ? "bg-destructive"
                            : row.tone === "soon"
                              ? "bg-amber-300"
                              : "bg-emerald-300")
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{row.label}</p>
                        <p className="text-[11px] text-muted-foreground">{row.when}</p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{row.amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ---------------------------------------------------------------- how */}
        <section id="how" className="scroll-mt-24 py-20">
          <Reveal>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">How it works</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Set up before your coffee goes cold
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((item, index) => (
              <Reveal key={item.step} delay={index * 90}>
                <div className="glass h-full rounded-3xl p-6">
                  <span className="text-aurora text-3xl font-bold tabular-nums">{item.step}</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------------- security */}
        <section className="py-20">
          <Reveal>
            <div className="glass rounded-[2rem] p-8 sm:p-12">
              <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground/80">
                    <Lock className="size-3.5 text-primary" />
                    Privacy first
                  </span>
                  <h2 className="mt-5 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                    Your money data stays yours
                  </h2>
                  <p className="mt-4 max-w-xl text-muted-foreground">
                    Spendly never connects to your bank. Passwords are hashed with bcrypt, sessions
                    live in signed httpOnly cookies, and every expense, budget and commitment is
                    scoped to the account that owns it.
                  </p>
                </div>
                <ul className="space-y-3">
                  {[
                    "No bank or card details, ever",
                    "Cross-account access returns 404, not your data",
                    "Rate-limited sign-in and sign-up",
                    "Delete your account and everything goes with it",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 text-sm"
                    >
                      <ShieldCheck className="size-4 shrink-0 text-emerald-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------------------------------------------------------------- faq */}
        <section id="faq" className="scroll-mt-24 py-20">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Questions, answered
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {FAQ.map((item, index) => (
              <Reveal key={item.q} delay={index * 60}>
                <div className="glass h-full rounded-3xl p-6">
                  <h3 className="font-semibold tracking-tight">{item.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- cta */}
        <section className="py-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 p-10 text-center sm:p-16">
              <div aria-hidden className="bg-aurora absolute inset-0 -z-10 opacity-20 blur-2xl" />
              <span className="bg-aurora glow mx-auto grid size-12 place-items-center rounded-2xl">
                <Wallet className="size-6 text-white" />
              </span>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Start tracking in under a minute
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Free, no card, nothing to connect. Just your expenses, your budgets and the bills
                you’re never going to forget again.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/signup">
                    Get started free
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* -------------------------------------------------------------- footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="bg-aurora grid size-7 place-items-center rounded-lg">
              <Wallet className="size-4 text-white" />
            </span>
            <span className="font-semibold text-foreground">Spendly</span>
          </div>
          <nav aria-label="Footer" className="flex items-center gap-5">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <Link href="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="transition-colors hover:text-foreground">
              Create account
            </Link>
          </nav>
          <p>Built for tracking what actually leaves your account.</p>
        </div>
      </footer>
    </>
  )
}
