"use client"

import { CalendarDays, ChartColumn, ChartPie, Layers, Wallet } from "lucide-react"
import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CategoryIcon } from "@/components/category-icon"
import { EmptyState } from "@/components/empty-state"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategoryMeta } from "@/lib/categories"
import {
  formatCurrency,
  formatCurrencyCompact,
  formatCurrencyWhole,
  formatMonthKey,
  monthKey,
  todayISO,
} from "@/lib/format"
import { useExpenseStore } from "@/lib/store"

const TOOLTIP_PROPS = {
  formatter: (value: unknown) => formatCurrency(Number(value)),
  contentStyle: {
    background: "rgba(20, 20, 46, 0.92)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 14,
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(12px)",
  },
  itemStyle: { color: "#ecebff" },
  labelStyle: { color: "#a1a0c8" },
  cursor: { fill: "rgba(255, 255, 255, 0.04)" },
}

const AXIS_TICK = { fill: "#a1a0c8", fontSize: 12 }

export function SummaryView() {
  const { expenses, categories } = useExpenseStore()

  const total = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses])
  const currentMonth = monthKey(todayISO())
  const monthTotal = useMemo(
    () => expenses.filter((e) => monthKey(e.date) === currentMonth).reduce((sum, e) => sum + e.amount, 0),
    [expenses, currentMonth],
  )

  const categoryData = useMemo(
    () =>
      categories
        .map((name) => ({
          name,
          value: expenses.filter((e) => e.category === name).reduce((sum, e) => sum + e.amount, 0),
          color: getCategoryMeta(name).color,
        }))
        .filter((d) => d.value > 0)
        .sort((a, b) => b.value - a.value),
    [categories, expenses],
  )

  const monthlyData = useMemo(() => {
    const totals = new Map<string, number>()
    for (const e of expenses) totals.set(monthKey(e.date), (totals.get(monthKey(e.date)) ?? 0) + e.amount)
    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, value]) => ({ month: formatMonthKey(key), total: value }))
  }, [expenses])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} highlight label="Total spent" value={formatCurrencyWhole(total)} hint="All time" icon={Wallet} />
        <StatCard
          index={1}
          label="This month"
          value={formatCurrencyWhole(monthTotal)}
          hint={formatMonthKey(currentMonth)}
          icon={CalendarDays}
        />
        <StatCard
          index={2}
          label="Categories used"
          value={String(categoryData.length)}
          hint="With at least one expense"
          icon={Layers}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
            <CardDescription>All time</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="grid items-center gap-6 sm:grid-cols-[220px_minmax(0,1fr)]">
                <div className="relative mx-auto size-[220px]">
                  <PieChart width={220} height={220}>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={74}
                      outerRadius={106}
                      paddingAngle={3}
                      cornerRadius={8}
                      stroke="none"
                      animationDuration={900}
                    >
                      {categoryData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip {...TOOLTIP_PROPS} />
                  </PieChart>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-bold tabular-nums">{formatCurrencyWhole(total)}</p>
                    </div>
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {categoryData.slice(0, 6).map((d) => (
                    <li key={d.name} className="flex items-center gap-3 text-sm">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: d.color, boxShadow: `0 0 10px ${d.color}` }}
                      />
                      <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
                      <span className="font-medium tabular-nums">{((d.value / total) * 100).toFixed(0)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState icon={ChartPie} title="No data yet" description="Add some expenses to see how your spending splits." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly trend</CardTitle>
            <CardDescription>Last 6 months with spending</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.06)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS_TICK} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={AXIS_TICK}
                    width={60}
                    tickFormatter={(v) => formatCurrencyCompact(Number(v))}
                  />
                  <Tooltip {...TOOLTIP_PROPS} />
                  <Bar dataKey="total" name="Spent" fill="url(#bar-gradient)" radius={[10, 10, 4, 4]} maxBarSize={48} animationDuration={900} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={ChartColumn} title="No data yet" description="Your monthly totals will appear here." />
            )}
          </CardContent>
        </Card>
      </div>

      {categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category breakdown</CardTitle>
            <CardDescription>Share of your total spending</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {categoryData.map((d, i) => {
                const pct = (d.value / total) * 100
                return (
                  <li key={d.name} className="flex items-center gap-3">
                    <CategoryIcon category={d.name} />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{d.name}</span>
                        <span className="shrink-0 tabular-nums">
                          <span className="font-semibold">{formatCurrency(d.value)}</span>
                          <span className="text-muted-foreground"> · {pct.toFixed(1)}%</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="animate-grow-x h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${d.color}99, ${d.color})`,
                            animationDelay: `${i * 60}ms`,
                          }}
                        />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
