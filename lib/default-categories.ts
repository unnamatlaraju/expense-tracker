/**
 * Default categories for a brand-new account. Kept free of React/icon imports
 * so it is safe to use from server code (e.g. the signup route). The UI-facing
 * list in `lib/categories.ts` re-exports this.
 */
export const DEFAULT_CATEGORIES = [
  "Rent",
  "Electricity Bill",
  "Rice Packets",
  "Tiffin/Meals",
  "Night Curry/Dinner",
  "Transport",
  "Snacks",
  "Others",
]
