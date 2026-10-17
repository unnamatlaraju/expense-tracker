import type { Metadata } from "next"
import { LoansView } from "@/components/views/loans-view"

export const metadata: Metadata = { title: "Loans" }

export default function Page() {
  return <LoansView />
}
