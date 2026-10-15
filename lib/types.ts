export type Frequency = "weekly" | "monthly" | "yearly"

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

export interface RecurringExpense {
  id: string
  description: string
  amount: number
  category: string
  frequency: Frequency
  nextDue: string
  isActive: boolean
}

export type NewExpense = Omit<Expense, "id" | "isRecurring" | "recurringFrequency"> & {
  recurringFrequency?: Frequency
}
