"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { DEFAULT_CATEGORIES } from "@/lib/categories"
import { addFrequency, todayISO } from "@/lib/format"
import type { Budget, Expense, NewExpense, RecurringExpense } from "@/lib/types"

/**
 * All persistence lives here. The UI only talks to `useExpenseStore()`,
 * so swapping localStorage for a real backend later only touches this file.
 */
const KEYS = {
  expenses: "expenses",
  categories: "categories",
  budgets: "budgets",
  recurring: "recurringExpenses",
} as const

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

interface ExpenseStore {
  isLoaded: boolean
  expenses: Expense[]
  categories: string[]
  budgets: Budget[]
  recurring: RecurringExpense[]
  addExpense: (input: NewExpense) => void
  deleteExpense: (id: string) => void
  addCategory: (name: string) => boolean
  setBudget: (category: string, limit: number) => void
  toggleRecurring: (id: string) => void
  deleteRecurring: (id: string) => void
  processRecurring: (id: string) => void
}

const StoreContext = createContext<ExpenseStore | null>(null)

export function ExpenseStoreProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [recurring, setRecurring] = useState<RecurringExpense[]>([])

  useEffect(() => {
    setExpenses(read(KEYS.expenses, []))
    setCategories(read(KEYS.categories, DEFAULT_CATEGORIES))
    setBudgets(read<Budget[]>(KEYS.budgets, []).map(({ category, limit }) => ({ category, limit })))
    setRecurring(read(KEYS.recurring, []))
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) localStorage.setItem(KEYS.expenses, JSON.stringify(expenses))
  }, [expenses, isLoaded])
  useEffect(() => {
    if (isLoaded) localStorage.setItem(KEYS.categories, JSON.stringify(categories))
  }, [categories, isLoaded])
  useEffect(() => {
    if (isLoaded) localStorage.setItem(KEYS.budgets, JSON.stringify(budgets))
  }, [budgets, isLoaded])
  useEffect(() => {
    if (isLoaded) localStorage.setItem(KEYS.recurring, JSON.stringify(recurring))
  }, [recurring, isLoaded])

  const addExpense = useCallback(({ recurringFrequency, ...input }: NewExpense) => {
    setExpenses((prev) => [
      ...prev,
      { ...input, id: uid(), isRecurring: !!recurringFrequency, recurringFrequency },
    ])
    if (recurringFrequency) {
      setRecurring((prev) => [
        ...prev,
        {
          id: uid(),
          description: input.description,
          amount: input.amount,
          category: input.category,
          frequency: recurringFrequency,
          nextDue: addFrequency(input.date, recurringFrequency),
          isActive: true,
        },
      ])
    }
  }, [])

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const addCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed || categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return false
      setCategories((prev) => [...prev, trimmed])
      return true
    },
    [categories],
  )

  const setBudget = useCallback((category: string, limit: number) => {
    setBudgets((prev) =>
      prev.some((b) => b.category === category)
        ? prev.map((b) => (b.category === category ? { category, limit } : b))
        : [...prev, { category, limit }],
    )
  }, [])

  const toggleRecurring = useCallback((id: string) => {
    setRecurring((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)))
  }, [])

  const deleteRecurring = useCallback((id: string) => {
    setRecurring((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const processRecurring = useCallback(
    (id: string) => {
      const item = recurring.find((r) => r.id === id)
      if (!item) return
      setExpenses((prev) => [
        ...prev,
        {
          id: uid(),
          description: item.description,
          amount: item.amount,
          category: item.category,
          date: todayISO(),
          isRecurring: true,
          recurringFrequency: item.frequency,
        },
      ])
      setRecurring((prev) =>
        prev.map((r) => (r.id === id ? { ...r, nextDue: addFrequency(r.nextDue, r.frequency) } : r)),
      )
    },
    [recurring],
  )

  const value = useMemo(
    () => ({
      isLoaded,
      expenses,
      categories,
      budgets,
      recurring,
      addExpense,
      deleteExpense,
      addCategory,
      setBudget,
      toggleRecurring,
      deleteRecurring,
      processRecurring,
    }),
    [isLoaded, expenses, categories, budgets, recurring, addExpense, deleteExpense, addCategory, setBudget, toggleRecurring, deleteRecurring, processRecurring],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useExpenseStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error("useExpenseStore must be used inside <ExpenseStoreProvider>")
  return store
}
