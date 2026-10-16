/** The animated purple/pink/cyan glow behind every page. Shared by the app shell and the auth pages. */
export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-aurora absolute -top-36 -left-32 size-[32rem] rounded-full bg-[#7c3aed] opacity-50 blur-[90px]" />
      <div className="animate-aurora absolute -right-24 -bottom-40 size-[28rem] rounded-full bg-[#ec4899] opacity-40 blur-[90px] [animation-delay:-6s]" />
      <div className="animate-aurora absolute top-1/3 left-1/2 size-[22rem] rounded-full bg-[#06b6d4] opacity-20 blur-[90px] [animation-delay:-12s]" />
    </div>
  )
}
