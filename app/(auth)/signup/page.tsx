import type { Metadata } from "next"
import { AuthForm } from "@/components/auth-form"

export const metadata: Metadata = { title: "Sign up" }

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const target = next && next.startsWith("/") ? next : "/"
  return <AuthForm mode="signup" next={target} />
}
