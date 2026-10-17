"use client"

import { CircleAlert, Loader2, LogOut, ShieldCheck, Trash2, UserRound } from "lucide-react"
import { type FormEvent, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api-client"
import { useExpenseStore } from "@/lib/store"

/**
 * The password-confirmed delete flow. Shared by the desktop card and the mobile
 * sheet so the wording, rate-limit feedback and error handling only exist once.
 */
function DeleteForm({ onCancel }: { onCancel: () => void }) {
  const { deleteAccount } = useExpenseStore()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError("")
    try {
      // On success the store navigates away to /login, so there is no
      // "finished" branch to handle — only the failure path below.
      await deleteAccount(password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.")
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm your password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "delete-account-error" : undefined}
        />
        <p className="text-xs text-muted-foreground">
          Every expense, budget and commitment on this account goes with it. This can&apos;t be undone.
        </p>
      </div>

      {error && (
        <p id="delete-account-error" role="alert" className="flex items-center gap-2 text-sm text-destructive">
          <CircleAlert className="size-4 shrink-0" />
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Keep my account
        </Button>
        <Button type="submit" variant="destructive" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
          Delete everything
        </Button>
      </DialogFooter>
    </form>
  )
}

export function DesktopAccountCard() {
  const { user, logout } = useExpenseStore()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0" />
        Signed in
      </p>
      <p className="mt-1.5 truncate text-sm font-medium">{user?.name ?? "…"}</p>
      <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
      <Button variant="ghost" size="sm" onClick={logout} className="mt-2 w-full justify-start text-muted-foreground">
        <LogOut />
        Sign out
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 />
        Delete account
      </Button>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently erases {user?.email ?? "your account"} and everything in it. There is no undo.
            </DialogDescription>
          </DialogHeader>
          <DeleteForm onCancel={() => setConfirming(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function MobileAccountMenu() {
  const { user, logout } = useExpenseStore()
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const change = (next: boolean) => {
    setOpen(next)
    // Reset the step so reopening never lands on the destructive form.
    if (!next) setConfirming(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Account"
        onClick={() => setOpen(true)}
        className="text-muted-foreground"
      >
        <UserRound />
      </Button>

      <Dialog open={open} onOpenChange={change}>
        <DialogContent>
          {confirming ? (
            <>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  This permanently erases {user?.email ?? "your account"} and everything in it. There is no undo.
                </DialogDescription>
              </DialogHeader>
              <DeleteForm onCancel={() => setConfirming(false)} />
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{user?.name ?? "Your account"}</DialogTitle>
                <DialogDescription>{user?.email ?? ""}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Button variant="outline" className="justify-start" onClick={logout}>
                  <LogOut />
                  Sign out
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 />
                  Delete account
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
