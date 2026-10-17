import type { MetadataRoute } from "next"

/**
 * Web app manifest, which is what makes Spendly installable: added to a phone's
 * home screen it opens fullscreen with no browser chrome, like a native app.
 *
 * `start_url` is the dashboard rather than `/`, because `/` is the marketing
 * page — an installed app should open on the thing you installed it for.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spendly — track expenses, budgets and bills",
    short_name: "Spendly",
    description:
      "Track daily expenses, set category budgets, and see every bill, EMI and subscription before it's due.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07071a",
    theme_color: "#07071a",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
