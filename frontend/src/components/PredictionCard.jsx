import { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import ShareCard from './ShareCard'
import CommentsSection from './CommentsSection'
import { getVotes, castVote } from '../api'

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

function ShareButton({ prediction, shareCardRef }) {
  const [state, setState] = useState('idle') // idle | generating | done

  async function handleShare() {
    if (state !== 'idle') return
    setState('generating')
    try {
      const el = shareCardRef.current
      el.style.visibility = 'visible'
      await document.fonts.ready
      await new Promise(r => setTimeout(r, 50))
      const canvas = await html2canvas(el, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      el.style.visibility = 'hidden'
      const link = document.createElement('a')
      link.download = `turn3-prediction-${prediction.race.replace(/\s+/g, '-').toLowerCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setState('done')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      shareCardRef.current.style.visibility = 'hidden'
      setState('idle')
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={state === 'generating'}
      className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg border transition ${
        state === 'done'
          ? 'border-green-500/40 text-green-400 bg-green-500/10'
          : state === 'generating'
          ? 'border-white/10 text-white/30 cursor-wait'
          : 'border-white/15 text-white/50 hover:text-white hover:border-white/30'
      }`}
      style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
    >
      {state === 'done' ? '✓ Saved' : state === 'generating' ? '...' : '↗ Share'}
    </button>
  )
}

function VoteBar({ votes, onVote, loading }) {
  const [casting, setCasting] = useState(false)
  const total = votes.agree + votes.disagree
  const agreePct = total > 0 ? Math.round((votes.agree / total) * 100) : 50

  async function handleVote(vote) {
    if (casting) return
    setCasting(true)
    await onVote(vote)
    setCasting(false)
  }

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <p className="text-xs uppercase tracking-widest text-white/40 mb-3">
        Do you agree with this prediction?
      </p>
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => handleVote('agree')}
          disabled={casting || loading}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all ${
            votes.user_vote === 'agree'
              ? 'bg-green-500 text-white'
              : 'bg-white/5 text-white/60 hover:bg-green-500/20 hover:text-green-400'
          }`}
        >
          👍 Agree {votes.agree > 0 && `(${votes.agree})`}
        </button>
        <button
          onClick={() => handleVote('disagree')}
          disabled={casting || loading}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold tracking-wide transition-all ${
            votes.user_vote === 'disagree'
              ? 'bg-red-500 text-white'
              : 'bg-white/5 text-white/60 hover:bg-red-500/20 hover:text-red-400'
          }`}
        >
          👎 Disagree {votes.disagree > 0 && `(${votes.disagree})`}
        </button>
      </div>
      {total > 0 && (
        <div className="space-y-1">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-white/10">
            <div className="bg-green-500 transition-all duration-500" style={{ width: `${agreePct}%` }} />
            <div className="bg-red-500 transition-all duration-500" style={{ width: `${100 - agreePct}%` }} />
          </div>
          <p className="text-xs text-white/30 text-center">
            {agreePct}% agree · {total} {total === 1 ? 'vote' : 'votes'}
          </p>
        </div>
      )}
    </div>
  )
}

export default function PredictionCard({ prediction, circuitId }) {
  const { race, podium, confidence, reasoning, weather } = prediction
  const shareCardRef = useRef(null)

  const [votes, setVotes] = useState({ agree: 0, disagree: 0, user_vote: null })
  const [votesLoading, setVotesLoading] = useState(true)

  useEffect(() => {
    if (!circuitId) return
    getVotes(circuitId)
      .then(setVotes)
      .catch(() => {})
      .finally(() => setVotesLoading(false))
  }, [circuitId])

  async function handleVote(vote) {
    if (!circuitId) return
    try {
      const updated = await castVote(circuitId, vote)
      setVotes(updated)
    } catch {}
  }

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
        <ShareButton prediction={prediction} shareCardRef={shareCardRef} />
      </div>

      {/* Vote bar */}
      {circuitId && (
        <VoteBar votes={votes} onVote={handleVote} loading={votesLoading} />
      )}

      {/* Comments */}
      {circuitId && <CommentsSection circuitId={circuitId} />}

      {/* Hidden share card — captured by html2canvas */}
      <ShareCard ref={shareCardRef} prediction={prediction} votes={votes} />
    </div>
  )
}
