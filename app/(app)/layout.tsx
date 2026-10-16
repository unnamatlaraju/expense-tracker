import type { ReactNode } from "react"
import { AppShell } from "@/components/app-shell"
import { ExpenseStoreProvider } from "@/lib/store"

/** Authenticated area: loads the user's data and renders the app chrome. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ExpenseStoreProvider>
      <AppShell>{children}</AppShell>
    </ExpenseStoreProvider>
  )
}
