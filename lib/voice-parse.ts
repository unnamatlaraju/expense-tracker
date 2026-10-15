/**
 * Turns a spoken sentence such as "I just spent 1000 on rent yesterday"
 * into expense fields. Pure and dependency-free so it is easy to test.
 */

export interface ParsedVoiceExpense {
  amount: number | null
  category: string
  description: string
  /** 0 = today, 1 = yesterday, ... */
  daysAgo: number
}

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, a: 1, an: 1,
}
const MULTIPLIERS: Record<string, number> = { hundred: 100, thousand: 1000, k: 1000, lakh: 100000, lakhs: 100000, lac: 100000 }

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Rent: ["rent", "room", "hostel", "pg"],
  "Electricity Bill": ["electricity", "current bill", "power bill", "eb bill", "light bill"],
  "Rice Packets": ["rice"],
  "Tiffin/Meals": ["tiffin", "breakfast", "lunch", "meal", "meals", "idli", "dosa", "biryani", "food"],
  "Night Curry/Dinner": ["dinner", "curry", "night"],
  Transport: ["bus", "auto", "uber", "ola", "rapido", "cab", "taxi", "train", "metro", "petrol", "fuel", "ticket", "travel", "transport"],
  Snacks: ["snack", "snacks", "chips", "tea", "chai", "coffee", "samosa", "biscuit", "biscuits", "juice", "ice cream", "chocolate"],
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

const FILLER = new Set([
  "hey", "hi", "hello", "app", "application", "spendly", "please", "pls", "plz", "i", "just", "spent", "spend",
  "paid", "pay", "add", "it", "this", "that", "to", "my", "the", "expense", "expenses", "rupees", "rupee", "rs",
  "inr", "bucks", "and", "for", "on", "of", "a", "an", "today", "yesterday", "day", "before", "last", "bought",
  "buy", "was", "is", "me", "can", "you", "have", "had", "worth", "at", "in", "ok", "okay",
])

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const hasPhrase = (text: string, phrase: string) => new RegExp(`\\b${escapeRegExp(phrase)}\\b`).test(text)

/** "two thousand five hundred" -> 2500. Returns null when no number words are present. */
function wordsToNumber(words: string[]): number | null {
  let total = 0
  let current = 0
  let seen = false
  for (const word of words) {
    if (word in UNITS) {
      current += UNITS[word]
      seen = seen || (word !== "a" && word !== "an")
    } else if (word in MULTIPLIERS) {
      current = Math.max(current, 1) * MULTIPLIERS[word]
      if (MULTIPLIERS[word] >= 1000) {
        total += current
        current = 0
      }
      seen = true
    } else if (word !== "and") {
      break
    }
  }
  return seen ? total + current : null
}

function parseAmount(text: string): number | null {
  const digit = text.match(/(?:₹|rs\.?\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|hundred|lakhs?|lac)?\b/)
  if (digit) {
    const base = Number.parseFloat(digit[1].replace(/,/g, ""))
    const unit = digit[2] ? MULTIPLIERS[digit[2]] : 1
    if (base > 0) return base * unit
  }
  const words = text.split(/\s+/)
  for (let i = 0; i < words.length; i++) {
    if (words[i] === "a" || words[i] === "an") {
      if (!(words[i + 1] in MULTIPLIERS)) continue
    }
    if (words[i] in UNITS || words[i] in MULTIPLIERS) {
      const value = wordsToNumber(words.slice(i))
      if (value && value > 0) return value
    }
  }
  return null
}

function parseDaysAgo(text: string, today: Date): number {
  if (hasPhrase(text, "day before yesterday")) return 2
  if (hasPhrase(text, "yesterday")) return 1
  const ago = text.match(/\b(\d+|one|two|three|four|five|six|seven)\s+days?\s+ago\b/)
  if (ago) return Number(ago[1]) || UNITS[ago[1]] || 0
  const weekday = WEEKDAYS.findIndex((d) => hasPhrase(text, d))
  if (weekday >= 0) return (today.getDay() - weekday + 7) % 7 || 7
  return 0
}

function parseCategory(text: string, categories: string[]): string {
  const custom = categories.find((c) => hasPhrase(text, c.toLowerCase()))
  if (custom) return custom
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (categories.includes(category) && keywords.some((k) => hasPhrase(text, k))) return category
  }
  return categories.includes("Others") ? "Others" : (categories[0] ?? "Others")
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

const meaningfulWords = (source: string) =>
  source
    .replace(/(?:₹|rs\.?)?\d[\d,]*(?:\.\d+)?\s*(k|thousand|hundred|lakhs?|lac)?\b/g, " ")
    .split(/\s+/)
    .filter((w) => w && !FILLER.has(w) && !(w in UNITS) && !(w in MULTIPLIERS) && !WEEKDAYS.includes(w) && w !== "ago" && w !== "days")
    .join(" ")

function parseDescription(text: string, category: string): string {
  const after = text.match(/\b(?:on|for)\s+(.+)$/)
  const description = (after && meaningfulWords(after[1])) || meaningfulWords(text)
  return description ? capitalize(description) : category
}

export function parseVoiceExpense(transcript: string, categories: string[], today = new Date()): ParsedVoiceExpense {
  const text = transcript
    .toLowerCase()
    .replace(/[^\p{L}\p{N}₹.,\s/-]/gu, " ")
    .replace(/(\d),(\d)/g, "$1$2")
    .replace(/[,]/g, " ")
    .replace(/\.(\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const category = parseCategory(text, categories)
  return {
    amount: parseAmount(text),
    category,
    description: parseDescription(text, category),
    daysAgo: parseDaysAgo(text, today),
  }
}
