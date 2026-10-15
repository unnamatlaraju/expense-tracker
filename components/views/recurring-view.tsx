"use client"

import Link from "next/link"
import { Pause, Play, Plus, Repeat, Trash2 } from "lucide-react"
import { CategoryIcon } from "@/components/category-icon"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/format"
import { useExpenseStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function RecurringView() {
  const { recurring, toggleRecurring, deleteRecurring, processRecurring } = useExpenseStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your recurring payments</CardTitle>
        <CardDescription>Press “Add now” to log this period’s payment.</CardDescription>
      </CardHeader>
      <CardContent>
        {recurring.length === 0 ? (
          <EmptyState
            icon={Repeat}
            title="No recurring payments"
            description="When you add an expense, tick “Repeat this expense” and it will appear here."
          >
            <Button asChild variant="outline">
              <Link href="/">Add an expense</Link>
            </Button>
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {recurring.map((r, i) => (
              <li
                key={r.id}
                className={cn(
                  "animate-rise-in flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-[border-color,opacity] duration-300 hover:border-white/20 sm:flex-row sm:items-center",
                  !r.isActive && "opacity-60",
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <CategoryIcon category={r.category} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{r.description}</p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                          r.isActive ? "bg-primary/15 text-[#d8b4fe]" : "bg-white/10 text-muted-foreground",
                        )}
                      >
                        {r.isActive ? r.frequency : "Paused"}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.category} · Next due {formatDate(r.nextDue)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="mr-auto font-semibold tabular-nums sm:mr-2">{formatCurrency(r.amount)}</p>
                  <Button variant="outline" size="sm" onClick={() => toggleRecurring(r.id)}>
                    {r.isActive ? <Pause /> : <Play />}
                    {r.isActive ? "Pause" : "Resume"}
                  </Button>
                  <Button size="sm" onClick={() => processRecurring(r.id)} disabled={!r.isActive}>
                    <Plus />
                    Add now
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${r.description}`}
                    onClick={() => deleteRecurring(r.id)}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
