import { describe, expect, it } from "vitest"
import { APP_HOME, safeNextPath } from "@/lib/navigation"

describe("safeNextPath", () => {
  it("keeps a normal in-app path", () => {
    expect(safeNextPath("/commitments")).toBe("/commitments")
    expect(safeNextPath("/reports?from=2026-10-01")).toBe("/reports?from=2026-10-01")
  })

  it("falls back to the app home when nothing is given", () => {
    expect(safeNextPath(undefined)).toBe(APP_HOME)
    expect(safeNextPath(null)).toBe(APP_HOME)
    expect(safeNextPath("")).toBe(APP_HOME)
  })

  it("rejects absolute URLs", () => {
    expect(safeNextPath("https://evil.example")).toBe(APP_HOME)
    expect(safeNextPath("javascript:alert(1)")).toBe(APP_HOME)
  })

  it("rejects protocol-relative URLs (open redirect)", () => {
    expect(safeNextPath("//evil.example")).toBe(APP_HOME)
    expect(safeNextPath("//evil.example/login")).toBe(APP_HOME)
  })

  it("honours a custom fallback", () => {
    expect(safeNextPath(undefined, "/")).toBe("/")
  })
})
