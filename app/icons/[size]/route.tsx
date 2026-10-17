import { ImageResponse } from "next/og"

/**
 * Home-screen icons for the installable web app, drawn with satori.
 *
 * The design is a full-bleed gradient with a centred glyph and plenty of
 * padding, which works both as a normal icon and as a *maskable* one — Android
 * crops maskable icons to whatever shape the launcher likes, so anything near
 * the edges can be cut off.
 */
export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }]
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params
  const pixels = Number(size)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: "linear-gradient(135deg, #7c3aed, #ec4899 60%, #f97316)",
          color: "#ffffff",
          fontSize: pixels * 0.42,
          fontWeight: 700,
        }}
      >
        S
      </div>
    ),
    { width: pixels, height: pixels },
  )
}
