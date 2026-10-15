"use client"

import { CircleAlert, Target } from "lucide-react"
import { type FormEvent, useState } from "react"
import { CategoryIcon } from "@/components/category-icon"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/format"
import { useExpenseStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const tone = (pct: number) => {
  if (pct > 100) return { bar: "linear-gradient(90deg, #f43f5e, #fb7185)", text: "text-destructive" }
  if (pct >= 80) return { bar: "linear-gradient(90deg, #f59e0b, #f97316)", text: "text-amber-300" }
  return { bar: "linear-gradient(90deg, #10b981, #22d3ee)", text: "text-emerald-300" }
}

export function BudgetView() {
  const { categories, budgets, expenses, setBudget } = useExpenseStore()
  const [category, setCategory] = useState(categories[0] ?? "Others")
  const [limit, setLimit] = useState("")
  const [error, setError] = useState("")

  const spentFor = (name: string) =>
    expenses.filter((e) => e.category === name).reduce((sum, e) => sum + e.amount, 0)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const value = Number.parseFloat(limit)
    if (!value || value <= 0) return setError("Enter a limit greater than 0.")
    setBudget(category, value)
    setLimit("")
    setError("")
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Set a budget</CardTitle>
          <CardDescription>Saving again for the same category updates its limit.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="budget-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="budget-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      <CategoryIcon category={c} className="size-6 rounded-lg [&_svg]:size-3.5" />
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget-limit">Monthly limit</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="budget-limit"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="0"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="pl-8 tabular-nums"
                />
              </div>
            </div>
            {error && (
              <p role="alert" className="animate-rise-in flex items-center gap-2 text-sm text-destructive">
                <CircleAlert className="size-4 shrink-0" />
                {error}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full">
              Save budget
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Budget overview</CardTitle>
          <CardDescription>Green is fine, orange is close, red is over.</CardDescription>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <EmptyState icon={Target} title="No budgets yet" description="Pick a category and set a limit to start tracking it." />
          ) : (
            <ul className="space-y-3">
              {budgets.map((b, i) => {
                const spent = spentFor(b.category)
                const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0
                const { bar, text } = tone(pct)
                return (
                  <li
                    key={b.category}
                    className="animate-rise-in space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors duration-300 hover:border-white/20"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={b.category} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{b.category}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatCurrency(spent)} of {formatCurrency(b.limit)}
                        </p>
                      </div>
                      <span className={cn("text-sm font-semibold tabular-nums", text)}>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="animate-grow-x h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: bar }} />
                    </div>
                    {spent > b.limit ? (
                      <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <CircleAlert className="size-3.5" />
                        Over budget by {formatCurrency(spent - b.limit)}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{formatCurrency(b.limit - spent)} left</p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
