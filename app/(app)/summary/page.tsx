import type { Metadata } from "next"
import { SummaryView } from "@/components/views/summary-view"

export const metadata: Metadata = { title: "Summary" }

export default function Page() {
  return <SummaryView />
}
