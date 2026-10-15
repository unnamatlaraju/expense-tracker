import type { Metadata } from "next"
import { RecurringView } from "@/components/views/recurring-view"

export const metadata: Metadata = { title: "Recurring" }

export default function Page() {
  return <RecurringView />
}
