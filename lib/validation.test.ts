import { describe, expect, it } from "vitest"
import {
  MAX_MONEY,
  budgetSchema,
  deleteAccountSchema,
  isKnownTimezone,
  isRealDate,
  newCommitmentSchema,
  newExpenseSchema,
  newLoanSchema,
  roundMoney,
  timezoneSchema,
  updateCommitmentSchema,
  updateExpenseSchema,
  updateLoanSchema,
  updateMeSchema,
} from "@/lib/validation"

const baseExpense = { description: "Coffee", category: "Snacks", date: "2026-10-16" }

describe("isRealDate", () => {
  it("accepts real dates", () => {
    expect(isRealDate("2026-10-16")).toBe(true)
    expect(isRealDate("2024-02-29")).toBe(true) // leap day
    expect(isRealDate("2026-01-31")).toBe(true)
  })

  it("rejects dates that look valid but don't exist", () => {
    expect(isRealDate("2026-02-31")).toBe(false)
    expect(isRealDate("2026-04-31")).toBe(false)
    expect(isRealDate("2026-13-01")).toBe(false)
    expect(isRealDate("2026-00-10")).toBe(false)
    expect(isRealDate("2025-02-29")).toBe(false) // not a leap year
  })

  it("rejects absurd years", () => {
    expect(isRealDate("0001-01-01")).toBe(false)
    expect(isRealDate("3000-01-01")).toBe(false)
  })
})

describe("roundMoney", () => {
  it("rounds to two decimals", () => {
    expect(roundMoney(10.567)).toBe(10.57)
    expect(roundMoney(10.561)).toBe(10.56)
    expect(roundMoney(250)).toBe(250)
  })
})

describe("newExpenseSchema", () => {
  it("accepts a normal expense", () => {
    const result = newExpenseSchema.safeParse({ ...baseExpense, amount: 250 })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.amount).toBe(250)
  })

  it("rounds the stored amount", () => {
    const result = newExpenseSchema.safeParse({ ...baseExpense, amount: 10.567 })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.amount).toBe(10.57)
  })

  it("rejects zero, negative and non-finite amounts", () => {
    for (const amount of [0, -5, Number.POSITIVE_INFINITY, Number.NaN]) {
      expect(newExpenseSchema.safeParse({ ...baseExpense, amount }).success).toBe(false)
    }
  })

  it("rejects amounts that would overflow the decimal column", () => {
    expect(newExpenseSchema.safeParse({ ...baseExpense, amount: MAX_MONEY + 1 }).success).toBe(false)
    expect(newExpenseSchema.safeParse({ ...baseExpense, amount: MAX_MONEY }).success).toBe(true)
  })

  it("rejects impossible dates", () => {
    const result = newExpenseSchema.safeParse({ ...baseExpense, amount: 100, date: "2026-02-31" })
    expect(result.success).toBe(false)
  })

  it("rejects malformed dates", () => {
    const result = newExpenseSchema.safeParse({ ...baseExpense, amount: 100, date: "16/10/2026" })
    expect(result.success).toBe(false)
  })

  it("trims text and caps its length", () => {
    const result = newExpenseSchema.safeParse({ ...baseExpense, amount: 100, description: "  Coffee  " })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.description).toBe("Coffee")

    expect(newExpenseSchema.safeParse({ ...baseExpense, amount: 100, description: "x".repeat(201) }).success).toBe(false)
  })
})

describe("budgetSchema", () => {
  it("applies the same money rules as expenses", () => {
    expect(budgetSchema.safeParse({ category: "Food", limit: 5000 }).success).toBe(true)
    expect(budgetSchema.safeParse({ category: "Food", limit: 0 }).success).toBe(false)
    expect(budgetSchema.safeParse({ category: "Food", limit: MAX_MONEY + 1 }).success).toBe(false)
  })

  it("rounds the limit", () => {
    const result = budgetSchema.safeParse({ category: "Food", limit: 99.999 })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(100)
  })
})

describe("timezone validation", () => {
  it("recognises real IANA zones", () => {
    expect(isKnownTimezone("Asia/Kolkata")).toBe(true)
    expect(isKnownTimezone("UTC")).toBe(true)
    expect(isKnownTimezone("America/New_York")).toBe(true)
  })

  it("rejects unknown zones and junk", () => {
    expect(isKnownTimezone("Not/AZone")).toBe(false)
    expect(isKnownTimezone("")).toBe(false)
    expect(isKnownTimezone("'; DROP TABLE users; --")).toBe(false)
  })

  it("validates the update payload", () => {
    expect(updateMeSchema.safeParse({ timezone: "Asia/Kolkata" }).success).toBe(true)
    expect(updateMeSchema.safeParse({ timezone: "Mars/Olympus" }).success).toBe(false)
    expect(updateMeSchema.safeParse({}).success).toBe(false)
  })

  it("caps the stored length", () => {
    expect(timezoneSchema.safeParse("A".repeat(65)).success).toBe(false)
  })
})

const baseCommitment = {
  description: "House rent",
  amount: 18000,
  category: "Rent",
  frequency: "monthly" as const,
  nextDue: "2026-11-01",
}

describe("newCommitmentSchema", () => {
  it("accepts a minimal commitment and fills the defaults", () => {
    const result = newCommitmentSchema.safeParse(baseCommitment)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.kind).toBe("other")
      expect(result.data.remindersEnabled).toBe(true)
      expect(result.data.remindDaysBefore).toBe(3)
      expect(result.data.autopay).toBe(false)
    }
  })

  it("rejects unknown kinds and frequencies", () => {
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, kind: "mortgage" }).success).toBe(false)
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, frequency: "daily" }).success).toBe(false)
  })

  it("bounds the reminder lead time to 0-30 days", () => {
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, remindDaysBefore: 0 }).success).toBe(true)
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, remindDaysBefore: 30 }).success).toBe(true)
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, remindDaysBefore: 31 }).success).toBe(false)
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, remindDaysBefore: -1 }).success).toBe(false)
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, remindDaysBefore: 2.5 }).success).toBe(false)
  })

  it("rejects an end date before the first due date", () => {
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, endDate: "2026-10-31" }).success).toBe(false)
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, endDate: "2026-11-01" }).success).toBe(true)
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, endDate: "2028-11-01" }).success).toBe(true)
  })

  it("applies the money and date rules", () => {
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, amount: 0 }).success).toBe(false)
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, amount: MAX_MONEY + 1 }).success).toBe(false)
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, amount: 10.567 }).success).toBe(true)
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, nextDue: "2026-02-31" }).success).toBe(false)
  })

  it("caps free text so a huge body can't be stored", () => {
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, notes: "x".repeat(501) }).success).toBe(false)
    expect(newCommitmentSchema.safeParse({ ...baseCommitment, description: "x".repeat(201) }).success).toBe(false)
  })
})

describe("updateCommitmentSchema", () => {
  it("allows a single field", () => {
    const result = updateCommitmentSchema.safeParse({ isActive: false })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ isActive: false })
  })

  it("rejects an empty patch", () => {
    expect(updateCommitmentSchema.safeParse({}).success).toBe(false)
  })

  it("strips unknown keys instead of passing them through", () => {
    const result = updateCommitmentSchema.safeParse({ amount: 500, userId: "someone-else", id: "hijack" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ amount: 500 })
  })

  it("accepts null to clear the optional fields", () => {
    const result = updateCommitmentSchema.safeParse({ endDate: null, notes: null })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ endDate: null, notes: null })
  })

  it("still enforces field rules when a field is present", () => {
    expect(updateCommitmentSchema.safeParse({ remindDaysBefore: 99 }).success).toBe(false)
    expect(updateCommitmentSchema.safeParse({ kind: "mortgage" }).success).toBe(false)
    expect(updateCommitmentSchema.safeParse({ nextDue: "2026-02-31" }).success).toBe(false)
  })
})

describe("updateExpenseSchema", () => {
  it("accepts a single changed field", () => {
    const result = updateExpenseSchema.safeParse({ amount: 320 })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ amount: 320 })
  })

  it("rejects an empty patch, which would be a no-op write", () => {
    expect(updateExpenseSchema.safeParse({}).success).toBe(false)
  })

  it("strips unknown keys instead of passing them through", () => {
    const result = updateExpenseSchema.safeParse({ description: "Lunch", userId: "someone-else", id: "hijack" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ description: "Lunch" })
  })

  it("accepts null to turn a repeating expense back into a one-off", () => {
    const result = updateExpenseSchema.safeParse({ recurringFrequency: null })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.recurringFrequency).toBeNull()
  })

  it("distinguishes an absent frequency from an explicit null", () => {
    const result = updateExpenseSchema.safeParse({ amount: 10 })
    expect(result.success).toBe(true)
    if (result.success) expect("recurringFrequency" in result.data).toBe(false)
  })

  it("still enforces field rules when a field is present", () => {
    expect(updateExpenseSchema.safeParse({ amount: 0 }).success).toBe(false)
    expect(updateExpenseSchema.safeParse({ amount: MAX_MONEY + 1 }).success).toBe(false)
    expect(updateExpenseSchema.safeParse({ date: "2026-02-31" }).success).toBe(false)
    expect(updateExpenseSchema.safeParse({ description: "  " }).success).toBe(false)
    expect(updateExpenseSchema.safeParse({ recurringFrequency: "daily" }).success).toBe(false)
  })
})

const baseLoan = {
  name: "Car loan",
  principal: 500000,
  annualRate: 9.5,
  tenureMonths: 60,
  firstDue: "2026-01-05",
}

describe("newLoanSchema", () => {
  it("accepts a loan with only the required terms", () => {
    const result = newLoanSchema.safeParse(baseLoan)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.principal).toBe(500000)
      expect(result.data.annualRate).toBe(9.5)
    }
  })

  it("accepts a 0% loan", () => {
    const result = newLoanSchema.safeParse({ ...baseLoan, annualRate: 0 })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.annualRate).toBe(0)
  })

  it("rounds money and the rate to 2dp", () => {
    const result = newLoanSchema.safeParse({ ...baseLoan, principal: 100000.456, annualRate: 8.629 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.principal).toBe(100000.46)
      expect(result.data.annualRate).toBe(8.63)
    }
  })

  it("rejects a rate outside 0-100", () => {
    expect(newLoanSchema.safeParse({ ...baseLoan, annualRate: -1 }).success).toBe(false)
    expect(newLoanSchema.safeParse({ ...baseLoan, annualRate: 100 }).success).toBe(true)
    expect(newLoanSchema.safeParse({ ...baseLoan, annualRate: 100.01 }).success).toBe(false)
  })

  it("requires a whole number of months within a sane range", () => {
    expect(newLoanSchema.safeParse({ ...baseLoan, tenureMonths: 1 }).success).toBe(true)
    expect(newLoanSchema.safeParse({ ...baseLoan, tenureMonths: 600 }).success).toBe(true)
    expect(newLoanSchema.safeParse({ ...baseLoan, tenureMonths: 0 }).success).toBe(false)
    expect(newLoanSchema.safeParse({ ...baseLoan, tenureMonths: 601 }).success).toBe(false)
    expect(newLoanSchema.safeParse({ ...baseLoan, tenureMonths: 24.5 }).success).toBe(false)
  })

  it("rejects a zero principal and impossible dates", () => {
    expect(newLoanSchema.safeParse({ ...baseLoan, principal: 0 }).success).toBe(false)
    expect(newLoanSchema.safeParse({ ...baseLoan, firstDue: "2026-02-31" }).success).toBe(false)
    expect(newLoanSchema.safeParse({ ...baseLoan, firstDue: "05/01/2026" }).success).toBe(false)
  })

  it("caps free text so a huge body can't be stored", () => {
    expect(newLoanSchema.safeParse({ ...baseLoan, name: "x".repeat(121) }).success).toBe(false)
    expect(newLoanSchema.safeParse({ ...baseLoan, lender: "x".repeat(121) }).success).toBe(false)
    expect(newLoanSchema.safeParse({ ...baseLoan, notes: "x".repeat(501) }).success).toBe(false)
  })
})

describe("updateLoanSchema", () => {
  it("allows a single field", () => {
    const result = updateLoanSchema.safeParse({ annualRate: 8.25 })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ annualRate: 8.25 })
  })

  it("rejects an empty patch", () => {
    expect(updateLoanSchema.safeParse({}).success).toBe(false)
  })

  it("strips unknown keys instead of passing them through", () => {
    const result = updateLoanSchema.safeParse({ principal: 250000, userId: "someone-else", id: "hijack" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ principal: 250000 })
  })

  it("accepts null to clear the optional fields", () => {
    const result = updateLoanSchema.safeParse({ lender: null, notes: null })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ lender: null, notes: null })
  })

  it("still enforces field rules when a field is present", () => {
    expect(updateLoanSchema.safeParse({ tenureMonths: 0 }).success).toBe(false)
    expect(updateLoanSchema.safeParse({ annualRate: 101 }).success).toBe(false)
    expect(updateLoanSchema.safeParse({ firstDue: "2026-02-31" }).success).toBe(false)
  })
})

describe("deleteAccountSchema", () => {
  it("requires a non-empty password", () => {
    expect(deleteAccountSchema.safeParse({ password: "Testpass123!" }).success).toBe(true)
    expect(deleteAccountSchema.safeParse({ password: "" }).success).toBe(false)
    expect(deleteAccountSchema.safeParse({}).success).toBe(false)
  })

  it("imposes no other password rules, so old passwords still work", () => {
    // A user whose password predates our length rule must still be able to leave.
    expect(deleteAccountSchema.safeParse({ password: "short" }).success).toBe(true)
  })
})
