"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { apiFetch } from "@/lib/api-client"
import { DEFAULT_CATEGORIES } from "@/lib/default-categories"
import type {
  AuthUser,
  Budget,
  Commitment,
  CommitmentPatch,
  Expense,
  NewCommitment,
  NewExpense,
} from "@/lib/types"

/**
 * The UI only talks to `useExpenseStore()`, so the switch from localStorage to
 * the REST API happened entirely inside this file. Mutations update state
 * optimistically where the server ID isn't needed, and re-sync from the server
 * if a request fails.
 */
interface Bootstrap {
  user: AuthUser
  expenses: Expense[]
  categories: string[]
  budgets: Budget[]
  commitments: Commitment[]
}

interface ExpenseStore {
  isLoaded: boolean
  error: string
  clearError: () => void
  user: AuthUser | null
  expenses: Expense[]
  categories: string[]
  budgets: Budget[]
  commitments: Commitment[]
  addExpense: (input: NewExpense) => Promise<void>
  deleteExpense: (id: string) => void
  addCategory: (name: string) => boolean
  setBudget: (category: string, limit: number) => void
  addCommitment: (input: NewCommitment) => Promise<void>
  updateCommitment: (id: string, patch: CommitmentPatch) => void
  toggleCommitment: (id: string) => void
  skipCommitment: (id: string) => void
  deleteCommitment: (id: string) => void
  processCommitment: (id: string) => void
  /** Ids of commitments with a mutation in flight, so their buttons can disable. */
  busyCommitments: string[]
  logout: () => void
}

const StoreContext = createContext<ExpenseStore | null>(null)

export function ExpenseStoreProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState("")
  const [user, setUser] = useState<AuthUser | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const loadedRef = useRef(false)

  // Commitments with a mutation in flight. The ref is the guard: it is read and
  // written synchronously, so a second click in the same tick can't slip past
  // it. The state exists purely so the buttons can render as disabled.
  const busyRef = useRef<Set<string>>(new Set())
  const [busyCommitments, setBusyCommitments] = useState<string[]>([])

  /**
   * Runs `action` at most once per commitment while a previous run is still in
   * flight. Without this a double-click on "Mark paid" fired two requests, and
   * because each one reads the due date *after* the previous advance, they paid
   * two different periods — logging two months of rent from one intent.
   */
  const once = useCallback(async (id: string, action: () => Promise<unknown>) => {
    if (busyRef.current.has(id)) return
    busyRef.current.add(id)
    setBusyCommitments((prev) => [...prev, id])
    try {
      await action()
    } finally {
      busyRef.current.delete(id)
      setBusyCommitments((prev) => prev.filter((busy) => busy !== id))
    }
  }, [])

  const applyBootstrap = useCallback((data: Bootstrap) => {
    setUser(data.user)
    setExpenses(data.expenses)
    setCategories(data.categories.length > 0 ? data.categories : DEFAULT_CATEGORIES)
    setBudgets(data.budgets)
    setCommitments(data.commitments)
  }, [])

  const refresh = useCallback(() => {
    apiFetch<Bootstrap>("/api/bootstrap").then(applyBootstrap).catch(() => {})
  }, [applyBootstrap])

  // Keep the server's idea of our timezone current so "today" is computed in
  // the user's local zone. Runs once per load, and only when it actually differs.
  const syncTimezone = useCallback((current: AuthUser) => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!detected || current.timezone === detected) return
    apiFetch<{ user: AuthUser }>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ timezone: detected }),
    })
      .then(({ user: updated }) => setUser(updated))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    apiFetch<Bootstrap>("/api/bootstrap")
      .then((data) => {
        if (cancelled) return
        applyBootstrap(data)
        syncTimezone(data.user)
        loadedRef.current = true
        setIsLoaded(true)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [applyBootstrap, syncTimezone])

  // Report failures, then re-sync so the UI never drifts from the server.
  const fail = useCallback(
    (e: unknown) => {
      setError(e instanceof Error ? e.message : "Something went wrong.")
      if (loadedRef.current) refresh()
    },
    [refresh],
  )

  // A duplicate response (e.g. a double-click race) carries an already-added
  // expense, so dedupe by id to avoid rendering it twice.
  const upsertExpense = useCallback((expense: Expense) => {
    setExpenses((prev) => (prev.some((e) => e.id === expense.id) ? prev : [...prev, expense]))
  }, [])

  const replaceCommitment = useCallback((commitment: Commitment) => {
    setCommitments((prev) => prev.map((c) => (c.id === commitment.id ? commitment : c)))
  }, [])

  const addExpense = useCallback(
    (input: NewExpense) => {
      // Returns the request promise so a form can keep its submit button
      // disabled until the write lands (a double-submit would duplicate it).
      return apiFetch<{ expense: Expense; commitment: Commitment | null }>("/api/expenses", {
        method: "POST",
        body: JSON.stringify(input),
      })
        .then(({ expense, commitment }) => {
          upsertExpense(expense)
          if (commitment) setCommitments((prev) => [...prev, commitment])
        })
        .catch(fail)
    },
    [fail, upsertExpense],
  )

  const deleteExpense = useCallback(
    (id: string) => {
      setExpenses((prev) => prev.filter((e) => e.id !== id))
      apiFetch(`/api/expenses/${id}`, { method: "DELETE" }).catch(fail)
    },
    [fail],
  )

  const addCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed || categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return false
      setCategories((prev) => [...prev, trimmed])
      apiFetch<{ name: string }>("/api/categories", {
        method: "POST",
        body: JSON.stringify({ name: trimmed }),
      })
        .then(({ name: saved }) => setCategories((prev) => prev.map((c) => (c === trimmed ? saved : c))))
        .catch(fail)
      return true
    },
    [categories, fail],
  )

  const setBudget = useCallback(
    (category: string, limit: number) => {
      setBudgets((prev) =>
        prev.some((b) => b.category === category)
          ? prev.map((b) => (b.category === category ? { category, limit } : b))
          : [...prev, { category, limit }],
      )
      apiFetch<{ budget: Budget }>("/api/budgets", {
        method: "PUT",
        body: JSON.stringify({ category, limit }),
      })
        .then(({ budget }) => setBudgets((prev) => prev.map((b) => (b.category === category ? budget : b))))
        .catch(fail)
    },
    [fail],
  )

  const addCommitment = useCallback(
    (input: NewCommitment) => {
      // Returns the promise so the form can guard against a double-submit.
      return apiFetch<{ commitment: Commitment }>("/api/commitments", {
        method: "POST",
        body: JSON.stringify(input),
      })
        .then(({ commitment }) => setCommitments((prev) => [...prev, commitment]))
        .catch(fail)
    },
    [fail],
  )

  const updateCommitment = useCallback(
    (id: string, patch: CommitmentPatch) => {
      void once(id, () =>
        apiFetch<{ commitment: Commitment }>(`/api/commitments/${id}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        })
          .then(({ commitment }) => replaceCommitment(commitment))
          .catch(fail),
      )
    },
    [fail, once, replaceCommitment],
  )

  // Separate from updateCommitment so the flip feels instant; it's just one flag.
  const toggleCommitment = useCallback(
    (id: string) => {
      if (busyRef.current.has(id)) return
      const current = commitments.find((c) => c.id === id)
      if (!current) return
      const isActive = !current.isActive
      setCommitments((prev) => prev.map((c) => (c.id === id ? { ...c, isActive } : c)))
      void once(id, () =>
        apiFetch<{ commitment: Commitment }>(`/api/commitments/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        })
          .then(({ commitment }) => replaceCommitment(commitment))
          .catch(fail),
      )
    },
    [commitments, fail, once, replaceCommitment],
  )

  const skipCommitment = useCallback(
    (id: string) => {
      void once(id, () =>
        apiFetch<{ commitment: Commitment }>(`/api/commitments/${id}/skip`, { method: "POST" })
          .then(({ commitment }) => replaceCommitment(commitment))
          .catch(fail),
      )
    },
    [fail, once, replaceCommitment],
  )

  const deleteCommitment = useCallback(
    (id: string) => {
      if (busyRef.current.has(id)) return
      setCommitments((prev) => prev.filter((c) => c.id !== id))
      void once(id, () => apiFetch(`/api/commitments/${id}`, { method: "DELETE" }).catch(fail))
    },
    [fail, once],
  )

  const processCommitment = useCallback(
    (id: string) => {
      void once(id, () =>
        apiFetch<{ expense: Expense; commitment: Commitment }>(`/api/commitments/${id}/process`, { method: "POST" })
          .then(({ expense, commitment }) => {
            upsertExpense(expense)
            replaceCommitment(commitment)
          })
          .catch(fail),
      )
    },
    [fail, once, replaceCommitment, upsertExpense],
  )

  const logout = useCallback(() => {
    apiFetch("/api/auth/logout", { method: "POST" })
      .catch(() => {})
      .finally(() => {
        window.location.href = "/login"
      })
  }, [])

  const clearError = useCallback(() => setError(""), [])

  const value = useMemo(
    () => ({
      isLoaded,
      error,
      clearError,
      user,
      expenses,
      categories,
      budgets,
      commitments,
      addExpense,
      deleteExpense,
      addCategory,
      setBudget,
      addCommitment,
      updateCommitment,
      toggleCommitment,
      skipCommitment,
      deleteCommitment,
      processCommitment,
      busyCommitments,
      logout,
    }),
    [
      isLoaded,
      error,
      clearError,
      user,
      expenses,
      categories,
      budgets,
      commitments,
      addExpense,
      deleteExpense,
      addCategory,
      setBudget,
      addCommitment,
      updateCommitment,
      toggleCommitment,
      skipCommitment,
      deleteCommitment,
      processCommitment,
      busyCommitments,
      logout,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useExpenseStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error("useExpenseStore must be used inside <ExpenseStoreProvider>")
  return store
}
