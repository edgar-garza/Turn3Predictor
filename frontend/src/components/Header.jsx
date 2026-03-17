// T-029 — Turn 3 branding with podcast association
export default function Header() {
  return (
    <header className="border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* T3 mark */}
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-600">
          <span
            className="text-white text-lg font-black leading-none"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            T3
          </span>
        </div>
        <div className="flex flex-col leading-tight">
          <span
            className="text-white font-black uppercase text-base tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Turn 3
            <span className="text-red-600 ml-1">F1 Predictor</span>
          </span>
          <span className="text-white/30 text-[10px] uppercase tracking-widest">
            by Turn 3 Podcast
          </span>
        </div>
      </div>

      {/* Season badge */}
      <div className="hidden sm:flex items-center gap-1.5 border border-white/10 rounded-full px-3 py-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
        <span className="text-white/40 text-xs uppercase tracking-widest"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          2026 Season
        </span>
      </div>
    </header>
  )
}
