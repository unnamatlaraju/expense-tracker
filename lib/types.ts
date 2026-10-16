export type Frequency = "weekly" | "monthly" | "yearly"

/** Label only — "emi" does not imply the loan maths from the loans feature. */
export type CommitmentKind = "bill" | "emi" | "subscription" | "other"

export interface AuthUser {
  id: string
  name: string
  email: string
  /** IANA timezone, kept in sync from the browser. */
  timezone?: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  isRecurring?: boolean
  recurringFrequency?: Frequency
}

export interface Budget {
  category: string
  limit: number
}

/** A recurring outflow: a bill, EMI, subscription or anything else on a schedule. */
export interface Commitment {
  id: string
  description: string
  amount: number
  category: string
  frequency: Frequency
  kind: CommitmentKind
  /** The next unpaid period's due date (YYYY-MM-DD). */
  nextDue: string
  isActive: boolean
  remindersEnabled: boolean
  remindDaysBefore: number
  endDate?: string
  autopay: boolean
  notes?: string
}

export type NewExpense = Omit<Expense, "id" | "isRecurring" | "recurringFrequency"> & {
  recurringFrequency?: Frequency
}

export interface NewCommitment {
  description: string
  amount: number
  category: string
  frequency: Frequency
  kind: CommitmentKind
  /** The first due date. */
  nextDue: string
  remindersEnabled?: boolean
  remindDaysBefore?: number
  endDate?: string | null
  autopay?: boolean
  notes?: string | null
}

/** Every field is optional; only what's present gets changed. */
export type CommitmentPatch = Partial<Omit<NewCommitment, "kind" | "frequency">> & {
  kind?: CommitmentKind
  frequency?: Frequency
  isActive?: boolean
}
