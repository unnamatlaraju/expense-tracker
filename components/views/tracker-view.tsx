"use client"

import { Check, CircleAlert, Plus, Receipt, Repeat, Search, SearchX, Sparkles } from "lucide-react"
import { type FormEvent, useMemo, useRef, useState } from "react"
import { CategoryIcon } from "@/components/category-icon"
import { EditExpenseDialog } from "@/components/edit-expense-dialog"
import { EmptyState } from "@/components/empty-state"
import { ExpenseRow } from "@/components/expense-row"
import { type VoiceDraft, VoiceAdd } from "@/components/voice-add"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCategoryMeta } from "@/lib/categories"
import { formatCurrency, todayISO } from "@/lib/format"
import { useExpenseStore } from "@/lib/store"
import type { Frequency } from "@/lib/types"
import { cn } from "@/lib/utils"

const FREQUENCIES: Frequency[] = ["weekly", "monthly", "yearly"]

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest amount" },
] as const

type Sort = (typeof SORTS)[number]["value"]

export function TrackerView() {
  const { expenses, categories, addExpense, deleteExpense, addCategory } = useExpenseStore()

  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState(categories[0] ?? "Others")
  const [date, setDate] = useState(todayISO)
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<Frequency>("monthly")
  const [error, setError] = useState("")
  const [justAdded, setJustAdded] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<Sort>("newest")
  /** The row being edited, or null when no editor is open. */
  const [editingId, setEditingId] = useState<string | null>(null)
  // A ref is the guard (synchronous, so a second submit in the same tick can't
  // slip through) and the state drives the button's disabled look.
  const submittingRef = useRef(false)
  const [submitting, setSubmitting] = useState(false)

  const total = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses])

  // `expenses` arrives oldest-first from the API. Searching matches the
  // description *or* the category so "food" finds the whole category too.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matches = needle
      ? expenses.filter(
          (e) => e.description.toLowerCase().includes(needle) || e.category.toLowerCase().includes(needle),
        )
      : [...expenses]

    if (sort === "highest") return matches.sort((a, b) => b.amount - a.amount)
    if (sort === "newest") return matches.reverse()
    return matches
  }, [expenses, query, sort])

  const searching = query.trim().length > 0

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submittingRef.current) return

    const value = Number.parseFloat(amount)
    if (!value || value <= 0) return setError("Enter an amount greater than 0.")
    if (!description.trim()) return setError("Add a short description, e.g. “Lunch”.")
    if (!date) return setError("Pick a date.")

    submittingRef.current = true
    setSubmitting(true)
    try {
      await addExpense({
        description: description.trim(),
        amount: value,
        category,
        date,
        recurringFrequency: isRecurring ? frequency : undefined,
      })
      setAmount("")
      setDescription("")
      setDate(todayISO())
      setIsRecurring(false)
      setFrequency("monthly")
      setError("")
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 1800)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const submitNewCategory = () => {
    const name = newCategory.trim()
    if (!name) return
    if (!addCategory(name)) return setError(`“${name}” already exists.`)
    setCategory(name)
    setNewCategory("")
    setShowNewCategory(false)
    setError("")
  }

  const fillForm = (draft: VoiceDraft) => {
    setAmount(draft.amount ? String(draft.amount) : "")
    setDescription(draft.description)
    setCategory(draft.category)
    setDate(draft.date)
    setError("")
    document.getElementById("amount")?.focus()
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        <VoiceAdd onEdit={fillForm} />
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#f0abfc]" />
            Add expense
          </CardTitle>
          <CardDescription>It only takes a few seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} noValidate className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-16 pl-10 text-3xl font-bold tabular-nums md:text-3xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g. Lunch at canteen"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label id="category-label">Category</Label>
              <div role="radiogroup" aria-labelledby="category-label" className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const selected = c === category
                  const { color } = getCategoryMeta(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-xl border py-1.5 pr-3 pl-1.5 text-xs font-medium transition-all duration-300 ease-out-expo outline-none hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-primary/30",
                        selected
                          ? "border-transparent bg-white/10 text-foreground"
                          : "border-white/10 bg-white/[0.03] text-foreground/90 hover:border-white/20 hover:text-foreground",
                      )}
                      style={selected ? { boxShadow: `inset 0 0 0 1.5px ${color}, 0 8px 20px -10px ${color}` } : undefined}
                    >
                      <CategoryIcon category={c} className="size-6 rounded-lg [&_svg]:size-3.5" />
                      {c}
                    </button>
                  )
                })}
                <button
                  type="button"
                  aria-expanded={showNewCategory}
                  onClick={() => setShowNewCategory((v) => !v)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-white/20 px-3 py-1.5 text-xs font-medium text-foreground/90 transition-colors duration-300 outline-none hover:border-white/40 hover:text-foreground focus-visible:ring-4 focus-visible:ring-primary/30"
                >
                  <Plus className="size-3.5" />
                  New
                </button>
              </div>
              {showNewCategory && (
                <div className="animate-rise-in flex gap-2 pt-1">
                  <Input
                    autoFocus
                    aria-label="New category name"
                    placeholder="e.g. Books"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        submitNewCategory()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="h-11" onClick={submitNewCategory}>
                    Add
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
              <div className="flex items-center gap-3">
                <Checkbox id="recurring" checked={isRecurring} onCheckedChange={(checked) => setIsRecurring(checked === true)} />
                <Label htmlFor="recurring" className="cursor-pointer">
                  Repeat this expense
                </Label>
                <Repeat className="ml-auto size-4 text-muted-foreground" />
              </div>
              {isRecurring && (
                <div role="radiogroup" aria-label="How often" className="animate-rise-in grid grid-cols-3 gap-1 rounded-xl bg-white/5 p-1">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      role="radio"
                      aria-checked={f === frequency}
                      onClick={() => setFrequency(f)}
                      className={cn(
                        "cursor-pointer rounded-lg py-1.5 text-xs font-medium capitalize transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        f === frequency ? "bg-aurora glow text-white" : "text-foreground/90 hover:text-foreground",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p role="alert" className="animate-rise-in flex items-center gap-2 text-sm text-destructive">
                <CircleAlert className="size-4 shrink-0" />
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {justAdded ? (
                <>
                  <Check /> Added
                </>
              ) : (
                <>
                  <Plus /> Add expense
                </>
              )}
            </Button>
          </form>
        </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Recent expenses</CardTitle>
          <CardDescription>
            {searching
              ? `${visible.length} of ${expenses.length} ${expenses.length === 1 ? "entry" : "entries"}`
              : `${expenses.length} ${expenses.length === 1 ? "entry" : "entries"}`}
          </CardDescription>
          <CardAction className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-aurora text-xl font-bold tabular-nums">{formatCurrency(total)}</p>
          </CardAction>
        </CardHeader>

        {expenses.length > 0 && (
          <div className="flex gap-2 px-6">
            <div className="relative flex-1">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search description or category"
                aria-label="Search expenses"
                className="pl-9"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger aria-label="Sort expenses" className="w-40 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <CardContent className="px-3 sm:px-4">
          {expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Add your first expense with the form and it will show up here."
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No matches"
              description={`Nothing matches “${query.trim()}”. Try a different word, or clear the search.`}
            />
          ) : (
            <ul className="max-h-[36rem] space-y-1 overflow-y-auto pr-1">
              {visible.map((e, i) => (
                <ExpenseRow
                  key={e.id}
                  expense={e}
                  index={i}
                  onEdit={() => setEditingId(e.id)}
                  onDelete={() => deleteExpense(e.id)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Mounted with a key so switching rows re-seeds the form fields. */}
      {editingId && (
        <EditExpenseDialog key={editingId} expenseId={editingId} onClose={() => setEditingId(null)} />
      )}
    </div>
  )
}
