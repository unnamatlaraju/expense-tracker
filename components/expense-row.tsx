import { Repeat, Trash2 } from "lucide-react"
import { CategoryIcon } from "@/components/category-icon"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Expense } from "@/lib/types"

export function ExpenseRow({
  expense,
  onDelete,
  index = 0,
}: {
  expense: Expense
  onDelete?: () => void
  index?: number
}) {
  return (
    <li
      className="group animate-rise-in flex items-center gap-3 rounded-2xl border border-transparent p-2.5 transition-colors duration-300 hover:border-white/10 hover:bg-white/[0.04]"
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <CategoryIcon category={expense.category} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{expense.description}</p>
          {expense.isRecurring && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-[#d8b4fe] capitalize">
              <Repeat className="size-3" />
              {expense.recurringFrequency}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {expense.category} · {formatDate(expense.date)}
        </p>
      </div>
      <p className="shrink-0 font-semibold tabular-nums">{formatCurrency(expense.amount)}</p>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${expense.description}`}
          onClick={onDelete}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
        >
          <Trash2 />
        </Button>
      )}
    </li>
  )
}
