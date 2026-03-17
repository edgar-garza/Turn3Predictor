// T-043 — Per-race prediction history card with score badge

const SCORE_COLOR = (pct) =>
  pct >= 80 ? 'text-green-400 border-green-500/40 bg-green-500/10' :
  pct >= 50 ? 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' :
              'text-red-400 border-red-500/40 bg-red-500/10'

const RESULT_ICON = { exact: '✓', wrong_position: '~', miss: '✕' }
const RESULT_COLOR = { exact: 'text-green-400', wrong_position: 'text-yellow-400', miss: 'text-white/30' }

function PodiumRow({ position, predicted, actual, breakdown }) {
  const result = breakdown?.[position]?.result
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-white/30 w-6 text-center font-bold shrink-0"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        {position}
      </span>
      <span className="text-white/80 flex-1 truncate">{predicted.driver}</span>
      {result && (
        <>
          <span className={`shrink-0 font-bold ${RESULT_COLOR[result]}`}>
            {RESULT_ICON[result]}
          </span>
          {result !== 'exact' && actual && (
            <span className="text-white/30 text-xs truncate">{actual.driver}</span>
          )}
        </>
      )}
    </div>
  )
}

export default function HistoryCard({ entry }) {
  const { race_name, round, weather, prediction, actual, score, status, created_at } = entry
  const date = new Date(created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col gap-4 bg-white/[0.02]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-white/30 text-xs uppercase tracking-widest mb-0.5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Round {round} · {date}
          </p>
          <h3 className="text-white font-black uppercase text-base leading-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            {race_name}
          </h3>
        </div>

        {status === 'scored' ? (
          <div className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-bold shrink-0 ${SCORE_COLOR(score.percentage)}`}
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            <span>{score.score}/6</span>
            <span className="opacity-60">·</span>
            <span>{score.percentage}%</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 border border-white/10 rounded-full px-3 py-1 text-xs font-bold text-white/30 shrink-0"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Pending
          </div>
        )}
      </div>

      {/* Podium comparison */}
      <div className="flex flex-col gap-2">
        {['P1', 'P2', 'P3'].map(pos => (
          <PodiumRow
            key={pos}
            position={pos}
            predicted={prediction[pos]}
            actual={actual?.[pos]}
            breakdown={score?.breakdown}
          />
        ))}
      </div>

      {/* Score breakdown hint */}
      {status === 'scored' && (
        <div className="flex gap-3 text-xs text-white/25 border-t border-white/5 pt-3">
          <span className="text-green-400/60">✓ exact</span>
          <span className="text-yellow-400/60">~ wrong pos</span>
          <span>✕ miss</span>
        </div>
      )}
    </div>
  )
}
