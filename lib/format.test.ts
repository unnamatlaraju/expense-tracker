import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { addFrequency, escapeHtml, monthKey, parseISODate, toISODate, todayISOIn } from "@/lib/format"

describe("todayISOIn", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 20:00 UTC: already tomorrow in India, still today in Los Angeles.
    vi.setSystemTime(new Date("2026-10-16T20:00:00Z"))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns YYYY-MM-DD", () => {
    expect(todayISOIn("Asia/Kolkata")).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("uses the user's local day, not the server's UTC day", () => {
    expect(todayISOIn("UTC")).toBe("2026-10-16")
    expect(todayISOIn("Asia/Kolkata")).toBe("2026-10-17") // +05:30 -> 01:30 next day
    expect(todayISOIn("America/Los_Angeles")).toBe("2026-10-16") // -07:00 -> 13:00 same day
  })

  it("handles zones behind UTC rolling back a day", () => {
    vi.setSystemTime(new Date("2026-10-16T04:00:00Z"))
    expect(todayISOIn("Pacific/Niue")).toBe("2026-10-15") // -11:00 -> 17:00 previous day
  })
})

describe("addFrequency", () => {
  it("advances weekly", () => {
    expect(addFrequency("2026-10-16", "weekly")).toBe("2026-10-23")
    expect(addFrequency("2026-10-30", "weekly")).toBe("2026-11-06")
  })

  it("advances monthly across a year boundary", () => {
    expect(addFrequency("2026-12-15", "monthly")).toBe("2027-01-15")
  })

  it("clamps month-end instead of rolling into the next month", () => {
    // The naive setMonth(Jan 31 + 1) would produce Mar 3.
    expect(addFrequency("2026-01-31", "monthly")).toBe("2026-02-28")
    expect(addFrequency("2024-01-31", "monthly")).toBe("2024-02-29") // leap year
    expect(addFrequency("2026-03-31", "monthly")).toBe("2026-04-30")
  })

  it("advances yearly and clamps Feb 29", () => {
    expect(addFrequency("2026-10-16", "yearly")).toBe("2027-10-16")
    expect(addFrequency("2024-02-29", "yearly")).toBe("2025-02-28")
  })
})

describe("date helpers", () => {
  it("round-trips ISO dates without a UTC off-by-one", () => {
    expect(toISODate(parseISODate("2026-01-01"))).toBe("2026-01-01")
    expect(toISODate(parseISODate("2026-12-31"))).toBe("2026-12-31")
  })

  it("extracts the month key", () => {
    expect(monthKey("2026-10-16")).toBe("2026-10")
  })
})

describe("escapeHtml", () => {
  it("neutralises markup", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    )
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry")
  })
})
