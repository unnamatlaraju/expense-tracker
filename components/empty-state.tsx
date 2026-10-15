import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <span className="relative grid size-14 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10">
        <span aria-hidden className="bg-aurora absolute inset-0 rounded-2xl opacity-25 blur-lg" />
        <Icon className="relative size-6 text-[#d8b4fe]" />
      </span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}
