"use client"

import { useEffect } from "react"

/**
 * Registers the service worker that makes Spendly installable.
 *
 * Production only: in development the asset URLs change on every edit, so a
 * cache in front of them just creates confusing stale-module bugs.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    const register = () => {
      // A failed registration only costs the install prompt, so never surface it.
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }

    if (document.readyState === "complete") {
      register()
      return
    }

    window.addEventListener("load", register, { once: true })
    return () => window.removeEventListener("load", register)
  }, [])

  return null
}
