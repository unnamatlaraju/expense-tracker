"use client"

import { Download, FileText, SearchX, X } from "lucide-react"
import { useMemo, useState } from "react"
import { EmptyState } from "@/components/empty-state"
import { ExpenseRow } from "@/components/expense-row"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { exportToCSV, exportToHTMLReport } from "@/lib/export"
import { formatCurrency } from "@/lib/format"
import { useExpenseStore } from "@/lib/store"

const ALL = "all"

export function ReportsView() {
  const { expenses, categories } = useExpenseStore()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [category, setCategory] = useState(ALL)

  const filtered = useMemo(
    () =>
      expenses
        .filter(
          (e) =>
            (!startDate || e.date >= startDate) &&
            (!endDate || e.date <= endDate) &&
            (category === ALL || e.category === category),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, startDate, endDate, category],
  )
  const total = filtered.reduce((sum, e) => sum + e.amount, 0)
  const hasFilters = !!startDate || !!endDate || category !== ALL

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setCategory(ALL)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter & export</CardTitle>
          <CardDescription>Leave a filter empty to include everything.</CardDescription>
          {hasFilters && (
            <CardAction>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X />
                Clear
              </Button>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="start-date">From</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">To</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="report-category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportToCSV(filtered)} disabled={filtered.length === 0}>
              <Download />
              Export CSV
            </Button>
            <Button
              variant="outline"
              disabled={filtered.length === 0}
              onClick={() =>
                exportToHTMLReport(filtered, {
                  startDate,
                  endDate,
                  category: category === ALL ? undefined : category,
                })
              }
            >
              <FileText />
              Export report (HTML)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            {filtered.length} {filtered.length === 1 ? "expense" : "expenses"}
          </CardDescription>
          <CardAction className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-aurora text-xl font-bold tabular-nums">{formatCurrency(total)}</p>
          </CardAction>
        </CardHeader>
        <CardContent className="px-3 sm:px-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={expenses.length === 0 ? "No expenses yet" : "Nothing matches"}
              description={
                expenses.length === 0 ? "Add some expenses first, then come back here." : "Try a different date range or category."
              }
            />
          ) : (
            <ul className="max-h-[32rem] space-y-1 overflow-y-auto pr-1">
              {filtered.map((e, i) => (
                <ExpenseRow key={e.id} expense={e} index={i} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
