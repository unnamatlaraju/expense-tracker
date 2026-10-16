import type { Metadata } from "next"
import { CommitmentsView } from "@/components/views/commitments-view"

export const metadata: Metadata = { title: "Commitments" }

export default function Page() {
  return <CommitmentsView />
}
