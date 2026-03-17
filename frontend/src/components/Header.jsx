export default function Header() {
  return (
    <header className="bg-[#0a0a0a] border-b border-white/10">
      {/* Logo bar */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo on white pill */}
        <div className="bg-white rounded-lg px-3 py-1.5 flex items-center">
          <img
            src="/Turn3LogoPNG.png"
            alt="Turn 3 Podcast"
            className="h-8 sm:h-10 w-auto object-contain"
          />
        </div>

        {/* Right side label */}
        <div className="flex items-center gap-3">
          <span
            className="text-white/50 text-xs sm:text-sm uppercase tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            F1 Predictor
          </span>
          <div className="hidden sm:flex items-center gap-1.5 border border-white/10 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            <span
              className="text-white/40 text-xs uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              2026 Season
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
