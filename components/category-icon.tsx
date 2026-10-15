import { getCategoryMeta } from "@/lib/categories"
import { cn } from "@/lib/utils"

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const { icon: Icon, color } = getCategoryMeta(category)
  return (
    <span
      aria-hidden
      className={cn("grid size-10 shrink-0 place-items-center rounded-xl", className)}
      style={{ backgroundColor: `${color}22`, color, boxShadow: `inset 0 0 0 1px ${color}33` }}
    >
      <Icon className="size-[18px]" />
    </span>
  )
}
