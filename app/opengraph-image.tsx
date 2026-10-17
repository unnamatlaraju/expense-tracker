import { ImageResponse } from "next/og"

/**
 * The image shown when a Spendly link is shared (Slack, WhatsApp, X, LinkedIn).
 * Built with satori, so it's inline styles and flexbox only — no className.
 */
export const alt = "Spendly — track expenses, budgets, bills and subscriptions"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const PILLS = ["Daily expenses", "Budgets", "Bills & EMIs", "Loans", "CSV export"]

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundImage: "linear-gradient(135deg, #07071a 0%, #180b36 45%, #2c0a2f 100%)",
          color: "#ecebff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundImage: "linear-gradient(135deg, #7c3aed, #ec4899 60%, #f97316)",
            }}
          />
          <div style={{ display: "flex", fontSize: 40 }}>Spendly</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", fontSize: 78, lineHeight: 1.1, maxWidth: 940 }}>
            Know exactly where your money goes.
          </div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.4, maxWidth: 900, color: "#a1a0c8" }}>
            Daily expenses, budgets, and every bill, EMI and subscription — in one clean dashboard.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {PILLS.map((pill) => (
            <div
              key={pill}
              style={{
                display: "flex",
                fontSize: 24,
                padding: "12px 22px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.16)",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  )
}
