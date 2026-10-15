import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  highlight = false,
  index = 0,
}: {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  highlight?: boolean
  index?: number
}) {
  return (
    <div
      className={cn(
        "animate-rise-in relative overflow-hidden rounded-3xl p-5 transition-transform duration-500 ease-out-expo hover:-translate-y-1",
        highlight ? "bg-aurora glow text-white" : "glass",
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className={cn("text-sm", highlight ? "text-white/85" : "text-muted-foreground")}>{label}</p>
        <span
          className={cn(
            "grid size-9 place-items-center rounded-xl",
            highlight ? "bg-white/20" : "bg-white/5 text-[#d8b4fe] ring-1 ring-white/10",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{value}</p>
      <p className={cn("mt-1 text-xs", highlight ? "text-white/80" : "text-muted-foreground")}>{hint}</p>
      {highlight && <span aria-hidden className="absolute -right-10 -bottom-12 size-40 rounded-full bg-white/15 blur-2xl" />}
    </div>
  )
}
