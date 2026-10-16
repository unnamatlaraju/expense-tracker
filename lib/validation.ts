import { z } from "zod"

/**
 * Request schemas shared by the API route handlers. Keeping them here means the
 * server validates the exact same shapes the client types describe.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Upper bound for money. Matches the `Decimal(12, 2)` columns in the schema. */
export const MAX_MONEY = 99_999_999.99

/** Rounds to 2 decimals so floating-point noise can't reach the database. */
export const roundMoney = (value: number) => Math.round(value * 100) / 100

/**
 * True only for dates that actually exist. The regex alone accepts `2026-02-31`
 * and `2026-13-45`, so we round-trip through `Date` and compare the parts back.
 */
export const isRealDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return false
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/** A `YYYY-MM-DD` string that is a real calendar date. */
export const dateSchema = z
  .string()
  .regex(ISO_DATE_RE, "Date must be in YYYY-MM-DD format")
  .refine(isRealDate, "Enter a real calendar date")

/** A positive money amount, bounded to fit the decimal columns, rounded to 2dp. */
const moneySchema = z
  .number()
  .positive("Amount must be greater than 0")
  .finite()
  .max(MAX_MONEY, "That amount is too large")
  .transform(roundMoney)

export const emailSchema = z.string().trim().toLowerCase().regex(EMAIL_RE, "Enter a valid email address")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long")

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

export const frequencySchema = z.enum(["weekly", "monthly", "yearly"])

export const commitmentKindSchema = z.enum(["bill", "emi", "subscription", "other"])

const remindDaysBeforeSchema = z
  .number()
  .int("Use a whole number of days")
  .min(0, "Cannot be negative")
  .max(30, "Cannot be more than 30 days")

const notesSchema = z.string().trim().max(500, "Notes are too long").nullable()

export const newExpenseSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(200),
  amount: moneySchema,
  category: z.string().trim().min(1).max(60),
  date: dateSchema,
  recurringFrequency: frequencySchema.optional(),
})

export const newCommitmentSchema = z
  .object({
    description: z.string().trim().min(1, "Description is required").max(200),
    amount: moneySchema,
    category: z.string().trim().min(1).max(60),
    frequency: frequencySchema,
    kind: commitmentKindSchema.default("other"),
    nextDue: dateSchema,
    remindersEnabled: z.boolean().default(true),
    remindDaysBefore: remindDaysBeforeSchema.default(3),
    endDate: dateSchema.nullable().optional(),
    autopay: z.boolean().default(false),
    notes: notesSchema.optional(),
  })
  .refine((value) => !value.endDate || value.endDate >= value.nextDue, {
    message: "End date must be on or after the first due date",
    path: ["endDate"],
  })

/**
 * A partial update. Deliberately has no defaults: an absent field must stay
 * absent so we only touch what the caller actually sent. Unknown keys are
 * stripped by Zod, so this doubles as protection against mass assignment.
 */
export const updateCommitmentSchema = z
  .object({
    description: z.string().trim().min(1, "Description is required").max(200).optional(),
    amount: moneySchema.optional(),
    category: z.string().trim().min(1).max(60).optional(),
    frequency: frequencySchema.optional(),
    kind: commitmentKindSchema.optional(),
    nextDue: dateSchema.optional(),
    isActive: z.boolean().optional(),
    remindersEnabled: z.boolean().optional(),
    remindDaysBefore: remindDaysBeforeSchema.optional(),
    endDate: dateSchema.nullable().optional(),
    autopay: z.boolean().optional(),
    notes: notesSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to update" })


export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
})

export const budgetSchema = z.object({
  category: z.string().trim().min(1).max(60),
  limit: moneySchema,
})

/** Accepts only IANA timezone names the runtime actually understands. */
export const isKnownTimezone = (value: string) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value })
    return true
  } catch {
    return false
  }
}

export const timezoneSchema = z
  .string()
  .min(1)
  .max(64)
  .refine(isKnownTimezone, "Unknown timezone")

export const updateMeSchema = z.object({ timezone: timezoneSchema })

/** Formats a ZodError as `{ field: message }` for the client. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form"
    if (!out[key]) out[key] = issue.message
  }
  return out
}
