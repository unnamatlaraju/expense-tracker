"use client"

import Link from "next/link"
import { CircleAlert, Loader2, Wallet } from "lucide-react"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError, apiFetch } from "@/lib/api-client"

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next: string }) {
  const isSignup = mode === "signup"
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [fields, setFields] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError("")
    setFields({})
    try {
      await apiFetch(`/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        body: JSON.stringify(isSignup ? { name, email, password } : { email, password }),
      })
      // Full navigation so the new session cookie is picked up by the middleware.
      window.location.assign(next)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
        setFields(err.fields ?? {})
      } else {
        setError("Something went wrong. Please try again.")
      }
      setBusy(false)
    }
  }

  return (
    <Card className="w-full max-w-md hover:transform-none">
      <CardHeader className="items-center text-center">
        <span className="bg-aurora glow grid size-12 place-items-center rounded-2xl">
          <Wallet className="size-6 text-white" />
        </span>
        <CardTitle className="mt-2 text-xl">{isSignup ? "Create your account" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isSignup ? "Start tracking your spending in seconds." : "Sign in to your Spendly account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="space-y-4">
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                aria-invalid={Boolean(fields.name)}
                onChange={(e) => setName(e.target.value)}
              />
              {fields.name && <p className="text-xs text-destructive">{fields.name}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              aria-invalid={Boolean(fields.email)}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fields.email && <p className="text-xs text-destructive">{fields.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder={isSignup ? "At least 8 characters" : "Your password"}
              value={password}
              aria-invalid={Boolean(fields.password)}
              onChange={(e) => setPassword(e.target.value)}
            />
            {fields.password && <p className="text-xs text-destructive">{fields.password}</p>}
          </div>

          {error && (
            <p role="alert" className="animate-rise-in flex items-center gap-2 text-sm text-destructive">
              <CircleAlert className="size-4 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account? " : "New to Spendly? "}
          <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-[#d8b4fe] hover:underline">
            {isSignup ? "Sign in" : "Create one"}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
