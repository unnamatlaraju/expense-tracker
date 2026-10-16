import bcrypt from "bcryptjs"

/**
 * Server-only password hashing. `bcryptjs` is pure JavaScript, so it needs no
 * native build step and runs anywhere Node runs.
 */
const ROUNDS = 12

export const hashPassword = (password: string) => bcrypt.hash(password, ROUNDS)

export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash)
