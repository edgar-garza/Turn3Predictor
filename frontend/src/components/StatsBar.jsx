// T-044 — Season accuracy tracker displayed on homepage

export default function StatsBar({ stats }) {
  if (!stats || stats.scored === 0) return null

  const { scored, avg_pct, avg_score, perfect_predictions } = stats

  return (
    <div className="w-full max-w-xl border border-white/10 rounded-xl px-4 sm:px-5 py-3 bg-white/[0.02] flex items-center gap-4 sm:gap-6 flex-wrap">
      <span className="text-white/30 text-xs uppercase tracking-widest shrink-0"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        2026 Season
      </span>

      <div className="flex gap-4 sm:gap-6 flex-wrap">
        <Stat label="Races scored" value={scored} />
        <Stat label="Avg accuracy" value={`${avg_pct}%`} highlight />
        <Stat label="Avg score" value={`${avg_score}/6`} />
        {perfect_predictions > 0 && (
          <Stat label="Perfect" value={perfect_predictions} />
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }) {
  return (
    <div className="flex flex-col">
      <span className={`text-lg font-black leading-tight ${highlight ? 'text-red-500' : 'text-white'}`}
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        {value}
      </span>
      <span className="text-white/30 text-[10px] uppercase tracking-wider">{label}</span>
    </div>
  )
}
