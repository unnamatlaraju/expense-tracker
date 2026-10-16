import type { Metadata } from "next"
import { AuthForm } from "@/components/auth-form"
import { safeNextPath } from "@/lib/navigation"

export const metadata: Metadata = { title: "Sign in" }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return <AuthForm mode="login" next={safeNextPath(next)} />
}
