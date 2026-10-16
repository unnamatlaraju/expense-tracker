import { describe, expect, it } from "vitest"
import {
  advanceCommitment,
  commitmentStatus,
  daysUntil,
  isOpen,
  monthlyEquivalent,
  sortForDisplay,
  sumMonthly,
} from "@/lib/commitments"
import type { Commitment } from "@/lib/types"

const TODAY = "2026-10-16"

const make = (over: Partial<Commitment> = {}): Commitment => ({
  id: "c1",
  description: "Rent",
  amount: 1000,
  category: "Rent",
  frequency: "monthly",
  kind: "bill",
  nextDue: TODAY,
  isActive: true,
  remindersEnabled: true,
  remindDaysBefore: 3,
  autopay: false,
  ...over,
})

describe("daysUntil", () => {
  it("is 0 on the day itself and signed either way", () => {
    expect(daysUntil("2026-10-16", TODAY)).toBe(0)
    expect(daysUntil("2026-10-19", TODAY)).toBe(3)
    expect(daysUntil("2026-10-13", TODAY)).toBe(-3)
  })

  it("counts across month and year boundaries", () => {
    expect(daysUntil("2026-11-01", TODAY)).toBe(16)
    expect(daysUntil("2027-01-01", "2026-12-31")).toBe(1)
  })

  it("uses whole days regardless of the clock", () => {
    // Parsed as UTC midnight, so no daylight-saving hour drift creeps in.
    expect(daysUntil("2027-03-14", "2027-03-13")).toBe(1)
  })
})

describe("commitmentStatus", () => {
  it("flags past, today and soon", () => {
    expect(commitmentStatus(make({ nextDue: "2026-10-10" }), TODAY)).toBe("overdue")
    expect(commitmentStatus(make({ nextDue: TODAY }), TODAY)).toBe("due-today")
  })

  it("treats the remind window as inclusive", () => {
    expect(commitmentStatus(make({ nextDue: "2026-10-19", remindDaysBefore: 3 }), TODAY)).toBe("due-soon")
    expect(commitmentStatus(make({ nextDue: "2026-10-20", remindDaysBefore: 3 }), TODAY)).toBe("upcoming")
  })

  it("honours a wider remind window", () => {
    expect(commitmentStatus(make({ nextDue: "2026-10-26", remindDaysBefore: 10 }), TODAY)).toBe("due-soon")
  })

  it("reports paused instead of due", () => {
    const paused = make({ nextDue: "2026-10-10", isActive: false })
    expect(commitmentStatus(paused, TODAY)).toBe("paused")
    expect(isOpen("paused")).toBe(false)
  })

  it("reports ended once the next period falls past the end date", () => {
    const ended = make({ nextDue: "2026-11-01", endDate: "2026-10-31" })
    expect(commitmentStatus(ended, TODAY)).toBe("ended")
    expect(isOpen("ended")).toBe(false)
  })

  it("stays live when the due date is on the end date", () => {
    const last = make({ nextDue: "2026-10-31", endDate: "2026-10-31" })
    expect(commitmentStatus(last, TODAY)).toBe("upcoming")
    expect(isOpen("upcoming")).toBe(true)
  })
})

describe("advanceCommitment", () => {
  it("moves one period and stays active", () => {
    expect(advanceCommitment({ nextDue: "2026-10-16", frequency: "monthly" })).toEqual({
      nextDue: "2026-11-16",
      ended: false,
      isActive: true,
    })
  })

  it("clamps month-end when advancing", () => {
    expect(advanceCommitment({ nextDue: "2026-01-31", frequency: "monthly" }).nextDue).toBe("2026-02-28")
  })

  it("deactivates on the first period past the end date", () => {
    const last = advanceCommitment({ nextDue: "2026-10-16", frequency: "monthly", endDate: "2026-11-01" })
    expect(last).toEqual({ nextDue: "2026-11-16", ended: true, isActive: false })
  })

  it("keeps going while the next period is still inside the plan", () => {
    const next = advanceCommitment({ nextDue: "2026-10-16", frequency: "monthly", endDate: "2026-11-16" })
    expect(next).toEqual({ nextDue: "2026-11-16", ended: false, isActive: true })
  })
})

describe("monthly cost", () => {
  it("spreads weekly and yearly amounts across a month", () => {
    expect(monthlyEquivalent(100, "monthly")).toBe(100)
    expect(monthlyEquivalent(1200, "yearly")).toBe(100)
    expect(monthlyEquivalent(120, "weekly")).toBeCloseTo(520, 5)
  })

  it("sums a mixed list", () => {
    expect(sumMonthly([{ amount: 100, frequency: "monthly" }, { amount: 1200, frequency: "yearly" }])).toBe(200)
    expect(sumMonthly([])).toBe(0)
  })
})

describe("sortForDisplay", () => {
  it("puts open items first, soonest due, with paused ones last", () => {
    const items = [
      make({ id: "paused", nextDue: "2026-10-01", isActive: false }),
      make({ id: "later", nextDue: "2026-11-20" }),
      make({ id: "soon", nextDue: "2026-10-18" }),
      make({ id: "overdue", nextDue: "2026-10-02" }),
    ]
    expect(sortForDisplay(items, TODAY).map((c) => c.id)).toEqual(["overdue", "soon", "later", "paused"])
  })

  it("does not mutate the input", () => {
    const items = [make({ id: "b", nextDue: "2026-11-01" }), make({ id: "a", nextDue: "2026-10-01" })]
    sortForDisplay(items, TODAY)
    expect(items.map((c) => c.id)).toEqual(["b", "a"])
  })
})
