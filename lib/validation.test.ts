import { describe, expect, it } from "vitest"
import {
  MAX_MONEY,
  budgetSchema,
  isKnownTimezone,
  isRealDate,
  newExpenseSchema,
  roundMoney,
  timezoneSchema,
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
