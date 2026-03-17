export default function Header() {
  return (
    <header className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
      <div className="flex items-baseline gap-2">
        <span
          className="text-3xl font-black uppercase tracking-tight text-red-600"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Turn 3
        </span>
        <span
          className="text-xl font-semibold uppercase tracking-widest text-white/60"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          F1 Predictor
        </span>
      </div>
    </header>
  )
}
