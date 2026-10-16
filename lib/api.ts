import { NextResponse } from "next/server"
import type { ZodError } from "zod"
import { fieldErrors } from "@/lib/validation"

/** Shared response helpers for the API route handlers. */

export const unauthorized = () => NextResponse.json({ error: "You need to sign in." }, { status: 401 })

export const notFound = (message = "Not found.") => NextResponse.json({ error: message }, { status: 404 })

export const badRequest = (error: ZodError) =>
  NextResponse.json({ error: "Please check the form.", fields: fieldErrors(error) }, { status: 400 })

export const serverError = () =>
  NextResponse.json({ error: "Something went wrong on our side." }, { status: 500 })

export const tooManyRequests = (retryAfterSeconds: number) =>
  NextResponse.json(
    { error: "Too many attempts. Please wait a bit and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  )

/** Safely parses a JSON body, returning `null` for malformed input. */
export const readJson = async (request: Request): Promise<unknown> => {
  try {
    return await request.json()
  } catch {
    return null
  }
}
