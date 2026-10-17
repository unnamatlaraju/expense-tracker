import { parseISODate, toISODate } from "@/lib/format"

/**
 * Loan amortisation maths.
 *
 * Everything here is pure and *derived*: the schedule is recomputed from the
 * loan's terms every time it is rendered and never stored, so it can never
 * drift out of sync with the numbers the user typed. Money is rounded to paise
 * at each step — the way a lender's statement does — and the final instalment
 * is adjusted to clear the balance exactly.
 */

/** Rounds to paise so a 360-row schedule can't accumulate float noise. */
const round2 = (value: number) => {
  const rounded = Math.round(value * 100) / 100
  // Normalise -0 to 0: it compares unequal to 0 under Object.is, which makes for
  // baffling test failures and "-₹0" in the UI.
  return rounded === 0 ? 0 : rounded
}

export interface LoanTerms {
  /** Amount borrowed. */
  principal: number
  /** Nominal annual interest rate as a percentage, e.g. 9.5 for 9.5% p.a. */
  annualRate: number
  /** Number of monthly instalments. */
  tenureMonths: number
  /** Due date of the first instalment (`YYYY-MM-DD`). */
  firstDue: string
}

export interface Instalment {
  /** 1-based instalment number. */
  number: number
  due: string
  /** Balance owed before this payment. */
  opening: number
  payment: number
  interest: number
  principal: number
  /** Balance owed after this payment. */
  closing: number
}

export interface Schedule {
  /** The equal monthly instalment (EMI). */
  emi: number
  instalments: Instalment[]
  totalInterest: number
  totalPayable: number
  /** Due date of the final instalment. */
  lastDue: string
}

/** Nominal annual rate (as a percentage) to a monthly decimal rate. */
export const monthlyRateOf = (annualRate: number) => annualRate / 100 / 12

/**
 * The standard reducing-balance EMI formula:
 *
 *   EMI = P · r · (1 + r)ⁿ / ((1 + r)ⁿ − 1)
 *
 * where `r` is the monthly rate and `n` the number of instalments. A 0% loan
 * divides by zero here, so it short-circuits to `principal / n`.
 */
export function calculateEmi({ principal, annualRate, tenureMonths }: LoanTerms): number {
  if (tenureMonths <= 0) return 0

  const rate = monthlyRateOf(annualRate)
  if (rate === 0) return round2(principal / tenureMonths)

  const growth = (1 + rate) ** tenureMonths
  return round2((principal * rate * growth) / (growth - 1))
}

/** Adds whole months, clamping the day the way a lender's calendar does. */
export function addMonths(value: string, months: number): string {
  const date = parseISODate(value)
  const day = date.getDate()
  // Move from the 1st, otherwise JavaScript rolls a non-existent day forward:
  // Aug 31 + 1 month would become Oct 1, skipping September.
  date.setDate(1)
  date.setMonth(date.getMonth() + months)
  // Then clamp back, so Aug 31 + 1 month = Sep 30.
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(day, lastDay))
  return toISODate(date)
}

/** The full month-by-month repayment plan, ending at a zero balance. */
export function buildSchedule(terms: LoanTerms): Schedule {
  const emi = calculateEmi(terms)
  const rate = monthlyRateOf(terms.annualRate)
  const instalments: Instalment[] = []

  let balance = round2(terms.principal)
  let totalInterest = 0

  for (let number = 1; number <= terms.tenureMonths; number += 1) {
    const opening = balance
    const interest = round2(opening * rate)
    let principalPaid = round2(emi - interest)
    let payment = emi

    // The last instalment clears whatever is left, and no payment may take more
    // than the outstanding balance. Without this a few paise would be stranded
    // at the end (or the final row would push the balance slightly negative).
    if (number === terms.tenureMonths || principalPaid > opening) {
      principalPaid = opening
      payment = round2(opening + interest)
    }

    balance = round2(opening - principalPaid)
    totalInterest = round2(totalInterest + interest)

    instalments.push({
      number,
      due: addMonths(terms.firstDue, number - 1),
      opening,
      payment,
      interest,
      principal: principalPaid,
      closing: balance,
    })
  }

  return {
    emi,
    instalments,
    totalInterest,
    totalPayable: round2(terms.principal + totalInterest),
    lastDue: instalments.length > 0 ? instalments[instalments.length - 1].due : terms.firstDue,
  }
}

/** How many instalments fall due on or before `today` (0 … tenureMonths). */
export const instalmentsDueBy = (schedule: Schedule, today: string) =>
  // `YYYY-MM-DD` strings compare correctly with `<`, so no date parsing needed.
  schedule.instalments.filter((instalment) => instalment.due <= today).length

export interface PrepaymentResult {
  /** Instalments needed to clear the loan with the extra payment applied. */
  months: number
  totalInterest: number
  /** Interest avoided compared with the original schedule. */
  interestSaved: number
  /** Instalments avoided compared with the original schedule. */
  monthsSaved: number
  /** True when the extra payment still can't cover the monthly interest. */
  neverRepays: boolean
}

/**
 * Replays the same month-by-month maths with `extraPerMonth` added to every
 * instalment, and reports what that saves against the original schedule.
 */
export function simulatePrepayment(terms: LoanTerms, extraPerMonth: number): PrepaymentResult {
  const { emi, totalInterest } = buildSchedule(terms)
  const rate = monthlyRateOf(terms.annualRate)

  if (extraPerMonth <= 0) {
    return { months: terms.tenureMonths, totalInterest, interestSaved: 0, monthsSaved: 0, neverRepays: false }
  }

  let balance = round2(terms.principal)
  let interest = 0
  let months = 0
  // A payment that doesn't even cover the monthly interest never amortises, so
  // bound the loop instead of hanging on a runaway while.
  const cap = terms.tenureMonths + 1200

  while (balance > 0 && months < cap) {
    const charged = round2(balance * rate)
    const payment = Math.min(round2(emi + extraPerMonth), round2(balance + charged))
    if (payment <= charged) break

    balance = round2(balance + charged - payment)
    interest = round2(interest + charged)
    months += 1
  }

  return {
    months,
    totalInterest: interest,
    interestSaved: round2(totalInterest - interest),
    monthsSaved: Math.max(0, terms.tenureMonths - months),
    neverRepays: balance > 0,
  }
}
