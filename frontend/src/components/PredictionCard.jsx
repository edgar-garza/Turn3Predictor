import { useState } from 'react'
import VoteBar from './VoteBar'
import CommentsSection from './CommentsSection'

// T-028 — mobile-responsive podium card
// T-030 — share button

const POSITION_STYLES = {
  P1: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', text: 'text-yellow-400' },
  P2: { bg: 'bg-zinc-400/10',   border: 'border-zinc-400/40',   text: 'text-zinc-300'  },
  P3: { bg: 'bg-orange-700/10', border: 'border-orange-700/40', text: 'text-orange-400' },
}

function ConfidenceBadge({ score }) {
  const color =
    score >= 8 ? 'text-green-400 border-green-500/40 bg-green-500/10' :
    score >= 5 ? 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10' :
                 'text-red-400 border-red-500/40 bg-red-500/10'

  return (
    <div className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-bold ${color}`}
      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
      <span className="uppercase tracking-widest">Confidence</span>
      <span className="text-base font-black">{score}/10</span>
    </div>
  )
}

function PodiumSlot({ position, driver }) {
  const s = POSITION_STYLES[position]
  return (
    <div className={`flex items-center gap-3 sm:gap-4 border ${s.border} ${s.bg} rounded-xl px-4 sm:px-5 py-3 sm:py-4`}>
      <span
        className={`text-xl sm:text-2xl font-black w-7 sm:w-8 text-center shrink-0 ${s.text}`}
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {position}
      </span>
      <div className="flex-1 min-w-0">
        <p
          className="text-white font-bold text-base sm:text-lg leading-tight truncate"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {driver.driver}
        </p>
        <p className="text-white/40 text-xs sm:text-sm truncate">{driver.constructor}</p>
      </div>
      <span
        className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${s.bg} ${s.text} border ${s.border}`}
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {driver.code}
      </span>
    </div>
  )
}

function ShareButton({ prediction }) {
  const [copied, setCopied] = useState(false)

  function handleShare() {
    const { race, podium, confidence } = prediction
    const text =
      `🏎️ ${race} Prediction\n` +
      `P1 ${podium.P1.driver} (${podium.P1.constructor})\n` +
      `P2 ${podium.P2.driver} (${podium.P2.constructor})\n` +
      `P3 ${podium.P3.driver} (${podium.P3.constructor})\n` +
      `Confidence: ${confidence}/10\n` +
      `— Turn 3 F1 Predictor`

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg border transition ${
        copied
          ? 'border-green-500/40 text-green-400 bg-green-500/10'
          : 'border-white/15 text-white/50 hover:text-white hover:border-white/30'
      }`}
      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
    >
      {copied ? '✓ Copied' : '↗ Share'}
    </button>
  )
}

export default function PredictionCard({ prediction, circuitId }) {
  const { race, podium, confidence, reasoning, weather } = prediction
  console.log('[PredictionCard] circuitId =', circuitId)

  return (
    <div className="w-full max-w-xl flex flex-col gap-4 animate-[fadeIn_0.4s_ease]">
      {/* Title row */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <h2
          className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {race}
        </h2>
        <ConfidenceBadge score={confidence} />
      </div>

      {/* Weather tag if present */}
      {weather && weather !== 'dry' && (
        <div className="flex items-center gap-1.5">
          <span className="text-white/30 text-xs uppercase tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Conditions:
          </span>
          <span className="text-white/60 text-xs capitalize">{weather}</span>
        </div>
      )}

      {/* Podium */}
      <div className="flex flex-col gap-2 sm:gap-3">
        {['P1', 'P2', 'P3'].map(pos => (
          <PodiumSlot key={pos} position={pos} driver={podium[pos]} />
        ))}
      </div>

      {/* AI Analysis */}
      <div className="border border-white/10 rounded-xl px-4 sm:px-5 py-4 bg-white/[0.03]">
        <p
          className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          AI Analysis
        </p>
        <p className="text-white/75 text-sm leading-relaxed">{reasoning}</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <ShareButton prediction={prediction} />
      </div>

      {circuitId && <VoteBar circuitId={circuitId} />}
      {circuitId && <CommentsSection circuitId={circuitId} />}
    </div>
  )
}
