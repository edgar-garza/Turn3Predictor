const POSITION_STYLES = {
  P1: { label: 'P1', bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', text: 'text-yellow-400', medal: '🥇' },
  P2: { label: 'P2', bg: 'bg-zinc-400/10', border: 'border-zinc-400/40', text: 'text-zinc-300', medal: '🥈' },
  P3: { label: 'P3', bg: 'bg-orange-700/10', border: 'border-orange-700/40', text: 'text-orange-400', medal: '🥉' },
}

function ConfidenceBadge({ score }) {
  const color =
    score >= 8 ? 'text-green-400 border-green-500/40 bg-green-500/10' :
    score >= 5 ? 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' :
                 'text-red-400 border-red-500/40 bg-red-500/10'

  return (
    <div className={`inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-sm font-semibold ${color}`}>
      <span>Confidence</span>
      <span className="text-lg font-black">{score}/10</span>
    </div>
  )
}

function PodiumSlot({ position, driver }) {
  const style = POSITION_STYLES[position]
  return (
    <div className={`flex items-center gap-4 border ${style.border} ${style.bg} rounded-xl px-5 py-4`}>
      <span className={`text-2xl font-black w-8 text-center ${style.text}`}
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
        {style.label}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-lg leading-tight truncate"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {driver.driver}
        </p>
        <p className="text-white/40 text-sm">{driver.constructor}</p>
      </div>
      <span
        className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded ${style.bg} ${style.text} border ${style.border}`}
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {driver.code}
      </span>
    </div>
  )
}

export default function PredictionCard({ prediction }) {
  const { race, podium, confidence, reasoning } = prediction

  return (
    <div className="w-full max-w-xl flex flex-col gap-5 animate-[fadeIn_0.4s_ease]">
      {/* Race title */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2
          className="text-2xl font-black uppercase tracking-tight text-white"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {race}
        </h2>
        <ConfidenceBadge score={confidence} />
      </div>

      {/* Podium */}
      <div className="flex flex-col gap-3">
        {['P1', 'P2', 'P3'].map(pos => (
          <PodiumSlot key={pos} position={pos} driver={podium[pos]} />
        ))}
      </div>

      {/* Reasoning */}
      <div className="border border-white/10 rounded-xl px-5 py-4 bg-white/[0.03]">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          AI Analysis
        </p>
        <p className="text-white/80 text-sm leading-relaxed">{reasoning}</p>
      </div>
    </div>
  )
}
