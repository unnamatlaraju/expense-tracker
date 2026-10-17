import { CalendarClock, ChartPie, FileText, Landmark, type LucideIcon, Receipt, Target } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  /** Shorter label for the mobile tab bar, where columns are narrow. */
  short?: string
  title: string
  description: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Expenses", title: "Your expenses", description: "Add what you spend and keep an eye on it.", icon: Receipt },
  { href: "/summary", label: "Summary", title: "Spending summary", description: "See where your money goes.", icon: ChartPie },
  { href: "/budget", label: "Budget", title: "Budgets", description: "Set a limit for each category and stay on track.", icon: Target },
  { href: "/commitments", label: "Commitments", short: "Bills", title: "Commitments", description: "Bills, EMIs and subscriptions you pay on a schedule.", icon: CalendarClock },
  { href: "/loans", label: "Loans", title: "Loans", description: "What your EMIs really cost, and what paying extra would save.", icon: Landmark },
  { href: "/reports", label: "Reports", title: "Reports", description: "Filter your expenses and download them.", icon: FileText },
]

export const getActiveNavIndex = (pathname: string) =>
  NAV_ITEMS.findIndex((item) => pathname.startsWith(item.href))
