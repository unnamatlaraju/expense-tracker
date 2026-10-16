import { TrendingDown } from "lucide-react"
import { CategoryIcon } from "@/components/category-icon"
import { formatCurrency, formatCurrencyWhole } from "@/lib/format"

/**
 * A static, decorative mock of the real dashboard — no data, no interactivity.
 * It exists purely so a first-time visitor can see what they'd be signing up
 * for. Everything is plain markup so it renders on the server with zero JS.
 */

const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"]
const BARS = [42, 61, 48, 76, 58, 90]

const ROWS = [
  { category: "Rent", description: "House rent", date: "2 Oct", amount: 12000 },
  { category: "Tiffin/Meals", description: "Lunch at the canteen", date: "Today", amount: 180 },
  { category: "Transport", description: "Auto to college", date: "Today", amount: 80 },
]

export function AppPreview() {
  return (
    <div className="relative">
      <div aria-hidden className="bg-aurora absolute -inset-6 -z-10 rounded-[2.5rem] opacity-20 blur-3xl" />

      <div className="glass rounded-3xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Your expenses · October</p>
            <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
              {formatCurrencyWhole(14380)}
            </p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
            <TrendingDown className="size-3" />
            12% under budget
          </span>
        </div>

        <div className="mt-6 flex h-24 items-end gap-1.5" aria-hidden>
          {BARS.map((height, index) => (
            <div key={index} className="relative h-full flex-1 overflow-hidden rounded-t-md bg-white/[0.04]">
              <div className="bg-aurora absolute inset-x-0 bottom-0 rounded-t-md" style={{ height: `${height}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex text-[10px] text-muted-foreground" aria-hidden>
          {MONTHS.map((month) => (
            <span key={month} className="flex-1 text-center">
              {month}
            </span>
          ))}
        </div>

        <div className="mt-5 space-y-1.5">
          {ROWS.map((row) => (
            <div
              key={row.description}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-2.5"
            >
              <CategoryIcon category={row.category} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  {row.category} · {row.date}
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">{formatCurrency(row.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
