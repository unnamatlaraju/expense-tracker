"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Fades and lifts its children into view as they scroll in.
 *
 * Progressive enhancement on purpose: the markup is rendered *visible*, so the
 * page is complete for a crawler and for a browser without JS. Only once the
 * client mounts — and only for elements still below the fold — does it hide
 * them and let an observer bring them back. A failure here therefore degrades
 * to "no animation", never to a blank page.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hidden, setHidden] = useState(false)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    // Anything already on screen (and anything measured with a collapsed
    // viewport, e.g. a background tab) stays visible and un-animated.
    const viewportHeight = window.innerHeight
    if (!viewportHeight || element.getBoundingClientRect().top < viewportHeight * 0.9) return

    setHidden(true)

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setAnimate(true)
          observer.disconnect()
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: animate ? `${delay}ms` : undefined }}
      className={cn(
        "transition-[opacity,transform] duration-[900ms] ease-out-expo motion-reduce:transition-none",
        hidden && !animate ? "translate-y-8 opacity-0" : "translate-y-0 opacity-100",
        className,
      )}
    >
      {children}
    </div>
  )
}
