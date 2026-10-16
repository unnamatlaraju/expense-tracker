import { describe, expect, it } from "vitest"
import { DEFAULT_CATEGORIES } from "@/lib/default-categories"
import { parseVoiceExpense } from "@/lib/voice-parse"

// 2026-10-16 is a Friday.
const friday = new Date("2026-10-16T10:00:00")

describe("parseVoiceExpense", () => {
  it("parses a digit amount, category and 'yesterday'", () => {
    expect(parseVoiceExpense("I just spent 1000 on rent yesterday", DEFAULT_CATEGORIES, friday)).toEqual({
      amount: 1000,
      category: "Rent",
      description: "Rent",
      daysAgo: 1,
    })
  })

  it("parses a spelled-out amount", () => {
    const result = parseVoiceExpense("two thousand five hundred for electricity bill", DEFAULT_CATEGORIES, friday)
    expect(result.amount).toBe(2500)
    expect(result.category).toBe("Electricity Bill")
    expect(result.daysAgo).toBe(0)
  })

  it("expands shorthand multipliers", () => {
    const result = parseVoiceExpense("2k for snacks", DEFAULT_CATEGORIES, friday)
    expect(result.amount).toBe(2000)
    expect(result.category).toBe("Snacks")
  })

  it("treats 'a thousand' as 1000", () => {
    expect(parseVoiceExpense("a thousand for transport", DEFAULT_CATEGORIES, friday).amount).toBe(1000)
  })

  it("works out a weekday reference relative to today", () => {
    const result = parseVoiceExpense("paid 200 for lunch on monday", DEFAULT_CATEGORIES, friday)
    expect(result.amount).toBe(200)
    expect(result.category).toBe("Tiffin/Meals")
    expect(result.description).toBe("Lunch")
    expect(result.daysAgo).toBe(4) // Friday back to the previous Monday
  })

  it("understands 'day before yesterday'", () => {
    expect(parseVoiceExpense("spent 50 on tea day before yesterday", DEFAULT_CATEGORIES, friday).daysAgo).toBe(2)
  })

  it("returns a null amount when no number is present", () => {
    const result = parseVoiceExpense("hello there", DEFAULT_CATEGORIES, friday)
    expect(result.amount).toBeNull()
    expect(result.daysAgo).toBe(0)
  })

  it("falls back to 'Others' for an unrecognised category", () => {
    const result = parseVoiceExpense("spent 300 on something odd", DEFAULT_CATEGORIES, friday)
    expect(result.category).toBe("Others")
  })

  it("does not blow up on symbols and emoji", () => {
    const result = parseVoiceExpense("₹1,200 🍕 for pizza!!!", DEFAULT_CATEGORIES, friday)
    expect(result.amount).toBe(1200)
    expect(result.daysAgo).toBe(0)
  })
})
