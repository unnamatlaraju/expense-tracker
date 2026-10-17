/*
 * A deliberately minimal service worker.
 *
 * It caches exactly one thing: Next's content-hashed build assets under
 * `/_next/static/`. Those files are immutable (their URL changes whenever their
 * contents do) and carry no user data.
 *
 * Everything else — HTML documents, API responses, anything behind a session —
 * is left to the network. Caching those would risk showing one user a stale
 * copy of another user's financial data, and a stale login screen is far worse
 * than a slightly slower first paint.
 *
 * The fetch handler existing at all is what makes the app installable in Chrome.
 */
const CACHE = "spendly-static-v1"
const ASSET_PREFIX = "/_next/static/"

self.addEventListener("install", () => {
  // Don't wait for old tabs to close before taking over.
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  // Drop caches from older versions of this worker.
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (!url.pathname.startsWith(ASSET_PREFIX)) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) return cached

      const response = await fetch(request)
      // Only store successful, same-origin responses (`fetch` follows redirects,
      // so `response.ok` also rules out a redirect into a login page).
      if (response.ok && response.type === "basic") await cache.put(request, response.clone())
      return response
    }),
  )
})
