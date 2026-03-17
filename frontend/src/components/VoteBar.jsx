import { useState, useEffect } from 'react'
import { getVotes, castVote } from '../api'

export default function VoteBar({ circuitId }) {
  const [votes, setVotes] = useState({ agree: 0, disagree: 0, user_vote: null })
  const [loading, setLoading] = useState(true)
  const [casting, setCasting] = useState(false)

  useEffect(() => {
    getVotes(circuitId)
      .then(setVotes)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [circuitId])

  async function handleVote(vote) {
    if (casting) return
    setCasting(true)
    try {
      const updated = await castVote(circuitId, vote)
      setVotes(updated)
    } catch {
      // silently ignore — vote UI not critical
    } finally {
      setCasting(false)
    }
  }

  const total = votes.agree + votes.disagree
  const agreePct = total > 0 ? Math.round((votes.agree / total) * 100) : 50

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
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${agreePct}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${100 - agreePct}%` }}
            />
          </div>
          <p className="text-xs text-white/30 text-center">
            {agreePct}% agree · {total} {total === 1 ? 'vote' : 'votes'}
          </p>
        </div>
      )}
    </div>
  )
}
