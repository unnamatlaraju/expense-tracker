import type { Frequency } from "@/lib/types"

const currencyFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })

export const formatCurrency = (amount: number) => currencyFormatter.format(amount)

const pad = (n: number) => String(n).padStart(2, "0")

export const toISODate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const todayISO = () => toISODate(new Date())

/**
 * Today's date (`YYYY-MM-DD`) in a given IANA timezone. The server's own clock
 * can be a day off from the user's, so anything that means "the user's today"
 * must go through this. Reading the parts avoids depending on locale formatting.
 */
export const todayISOIn = (timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ""
  return `${get("year")}-${get("month")}-${get("day")}`
}

/** Parses a `YYYY-MM-DD` string as a local date (avoids UTC off-by-one). */
export const parseISODate = (value: string) => {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export const formatDate = (value: string) =>
  parseISODate(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

export const monthKey = (value: string) => value.slice(0, 7)

export const formatMonthKey = (key: string) =>
  parseISODate(`${key}-01`).toLocaleDateString("en-IN", { month: "short", year: "numeric" })

export const addFrequency = (value: string, frequency: Frequency) => {
  const date = parseISODate(value)
  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7)
    return toISODate(date)
  }

  // Shift to the 1st before moving the month/year. Otherwise JavaScript rolls a
  // non-existent day forward: Jan 31 + 1 month would become Mar 3, skipping
  // February entirely. Afterwards we clamp back, so Jan 31 + 1 month = Feb 28/29.
  const dayOfMonth = date.getDate()
  date.setDate(1)
  if (frequency === "monthly") date.setMonth(date.getMonth() + 1)
  if (frequency === "yearly") date.setFullYear(date.getFullYear() + 1)
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(dayOfMonth, lastDayOfMonth))
  return toISODate(date)
}

export const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const wholeCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

export const formatCurrencyWhole = (amount: number) => wholeCurrencyFormatter.format(amount)
export const formatCurrencyCompact = (amount: number) => {
  const trim = (n: number) => String(Number(n.toFixed(1)))
  if (amount >= 1e7) return `₹${trim(amount / 1e7)}Cr`
  if (amount >= 1e5) return `₹${trim(amount / 1e5)}L`
  if (amount >= 1e3) return `₹${trim(amount / 1e3)}K`
  return `₹${Math.round(amount)}`
}
