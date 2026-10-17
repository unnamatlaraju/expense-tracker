import { describe, expect, it } from "vitest"
import { addMonths, buildSchedule, calculateEmi, instalmentsDueBy, simulatePrepayment, type LoanTerms } from "@/lib/loans"

const terms = (over: Partial<LoanTerms> = {}): LoanTerms => ({
  principal: 100_000,
  annualRate: 12,
  tenureMonths: 12,
  firstDue: "2026-01-01",
  ...over,
})

describe("calculateEmi", () => {
  it("matches the textbook figure for ₹1,00,000 at 12% over 12 months", () => {
    expect(calculateEmi(terms())).toBe(8884.88)
  })

  it("approaches the well-known rule of thumb over a long tenure", () => {
    // ₹50,00,000 at 8.5% for 240 months is a standard home-loan example: ≈ ₹43,391.
    const emi = calculateEmi(terms({ principal: 5_000_000, annualRate: 8.5, tenureMonths: 240 }))
    expect(emi).toBeGreaterThan(43_300)
    expect(emi).toBeLessThan(43_500)
  })

  it("divides evenly at 0% instead of dividing by zero", () => {
    expect(calculateEmi(terms({ annualRate: 0 }))).toBe(8333.33)
    expect(calculateEmi(terms({ annualRate: 0, tenureMonths: 1 }))).toBe(100_000)
  })

  it("is safe for a zero tenure", () => {
    expect(calculateEmi(terms({ tenureMonths: 0 }))).toBe(0)
  })
})

describe("addMonths", () => {
  it("clamps to the end of a shorter month", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28")
    expect(addMonths("2026-08-31", 1)).toBe("2026-09-30")
  })

  it("keeps the day of month when it exists", () => {
    expect(addMonths("2026-01-15", 1)).toBe("2026-02-15")
    expect(addMonths("2026-01-15", 12)).toBe("2027-01-15")
  })

  it("handles a leap February", () => {
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29")
  })

  it("walks forward and back across year boundaries", () => {
    expect(addMonths("2026-12-01", 1)).toBe("2027-01-01")
    expect(addMonths("2026-01-01", -1)).toBe("2025-12-01")
  })
})

describe("buildSchedule", () => {
  it("produces one row per instalment and ends at zero", () => {
    const schedule = buildSchedule(terms())
    expect(schedule.instalments).toHaveLength(12)
    expect(schedule.instalments[11].closing).toBe(0)
    expect(schedule.lastDue).toBe("2026-12-01")
  })

  it("keeps the balance chain consistent on every row", () => {
    const { instalments } = buildSchedule(terms({ tenureMonths: 60, principal: 750_000, annualRate: 9.25 }))
    instalments.forEach((row, i) => {
      expect(row.opening - row.principal).toBeCloseTo(row.closing, 2)
      expect(row.interest + row.principal).toBeCloseTo(row.payment, 2)
      if (i > 0) expect(row.opening).toBeCloseTo(instalments[i - 1].closing, 2)
    })
  })

  it("repays exactly the principal across all rows", () => {
    const { instalments } = buildSchedule(terms({ tenureMonths: 84, principal: 1_234_567.89, annualRate: 11.4 }))
    const repaid = instalments.reduce((sum, row) => sum + row.principal, 0)
    expect(repaid).toBeCloseTo(1_234_567.89, 2)
  })

  it("charges no interest at 0% and only on the outstanding balance", () => {
    const schedule = buildSchedule(terms({ annualRate: 0, principal: 12_000, tenureMonths: 12 }))
    expect(schedule.totalInterest).toBe(0)
    expect(schedule.totalPayable).toBe(12_000)
    expect(schedule.instalments.every((row) => row.payment === 1000)).toBe(true)
  })

  it("sums the payments into totalPayable", () => {
    const schedule = buildSchedule(terms({ tenureMonths: 36, principal: 400_000, annualRate: 10.5 }))
    const paid = schedule.instalments.reduce((sum, row) => sum + row.payment, 0)
    expect(paid).toBeCloseTo(schedule.totalPayable, 2)
    expect(schedule.totalPayable).toBeCloseTo(400_000 + schedule.totalInterest, 2)
  })

  it("interest falls and principal rises over the life of the loan", () => {
    const { instalments } = buildSchedule(terms({ tenureMonths: 24, principal: 500_000, annualRate: 10 }))
    expect(instalments[0].interest).toBeGreaterThan(instalments[23].interest)
    expect(instalments[23].principal).toBeGreaterThan(instalments[0].principal)
  })

  it("closes the loan early when rounding would overshoot the balance", () => {
    // A tiny principal over a long tenure is where the naive version strands paise.
    const schedule = buildSchedule(terms({ principal: 100, annualRate: 18, tenureMonths: 60 }))
    expect(schedule.instalments.at(-1)?.closing).toBe(0)
    expect(schedule.instalments.every((row) => row.closing >= 0)).toBe(true)
  })
})

describe("instalmentsDueBy", () => {
  const schedule = buildSchedule(terms())

  it("counts nothing before the first due date", () => {
    expect(instalmentsDueBy(schedule, "2025-12-31")).toBe(0)
  })

  it("counts the instalment due on the day itself", () => {
    expect(instalmentsDueBy(schedule, "2026-01-01")).toBe(1)
    expect(instalmentsDueBy(schedule, "2026-03-01")).toBe(3)
  })

  it("never exceeds the tenure", () => {
    expect(instalmentsDueBy(schedule, "2030-01-01")).toBe(12)
  })
})

describe("simulatePrepayment", () => {
  const loan = terms({ principal: 1_000_000, annualRate: 10, tenureMonths: 60 })

  it("returns the baseline when nothing extra is paid", () => {
    const result = simulatePrepayment(loan, 0)
    expect(result.months).toBe(60)
    expect(result.monthsSaved).toBe(0)
    expect(result.interestSaved).toBe(0)
    expect(result.totalInterest).toBe(buildSchedule(loan).totalInterest)
  })

  it("finishes sooner and pays less interest when extra is paid", () => {
    const result = simulatePrepayment(loan, 5000)
    expect(result.months).toBeLessThan(60)
    expect(result.monthsSaved).toBe(60 - result.months)
    expect(result.interestSaved).toBeGreaterThan(0)
    expect(result.neverRepays).toBe(false)
  })

  it("pays off in a single instalment when the extra clears the balance", () => {
    const result = simulatePrepayment(terms({ principal: 10_000, annualRate: 12, tenureMonths: 12 }), 10_000)
    expect(result.months).toBe(1)
    expect(result.interestSaved).toBeGreaterThan(0)
  })

  it("never reports a negative saving", () => {
    const result = simulatePrepayment(terms({ principal: 100_000, annualRate: 24, tenureMonths: 12 }), 1)
    expect(result.monthsSaved).toBeGreaterThanOrEqual(0)
    expect(result.interestSaved).toBeGreaterThanOrEqual(0)
    expect(result.neverRepays).toBe(false)
  })
})
