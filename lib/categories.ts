import {
  Bus,
  Cookie,
  House,
  type LucideIcon,
  Package,
  Soup,
  Tag,
  UtensilsCrossed,
  Wheat,
  Zap,
} from "lucide-react"

export { DEFAULT_CATEGORIES } from "@/lib/default-categories"

export const PALETTE = ["#a855f7", "#ec4899", "#f97316", "#22d3ee", "#34d399", "#facc15", "#60a5fa", "#fb7185"]

const KNOWN: Record<string, { icon: LucideIcon; color: string }> = {
  Rent: { icon: House, color: "#a855f7" },
  "Electricity Bill": { icon: Zap, color: "#facc15" },
  "Rice Packets": { icon: Wheat, color: "#f97316" },
  "Tiffin/Meals": { icon: UtensilsCrossed, color: "#34d399" },
  "Night Curry/Dinner": { icon: Soup, color: "#fb7185" },
  Transport: { icon: Bus, color: "#22d3ee" },
  Snacks: { icon: Cookie, color: "#ec4899" },
  Others: { icon: Package, color: "#60a5fa" },
}

const hash = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

export const getCategoryMeta = (name: string) =>
  KNOWN[name] ?? { icon: Tag, color: PALETTE[hash(name) % PALETTE.length] }
